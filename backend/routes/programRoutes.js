const express = require('express');
const router = express.Router();
const Program = require('../models/Program');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// Get all programs for the logged-in user
router.get('/', protect, async (req, res) => {
  try {
    // Always scope by ownership or explicit access — never return ALL programs globally.
    // Admin: own programs + programs where they have sharedUsers access.
    // Viewer/other: only programs they own or have been given access to.
    const query = {
      status: { $ne: 'archived' },
      $or: [
        { owner: req.user._id },
        { _id: { $in: req.user.programAccess || [] } },
        { 'sharedUsers.userId': req.user._id },
      ],
    };

    const programs = await Program.find(query).sort({ createdAt: -1 });
    res.json(programs);
  } catch (error) {
    console.error('GET_PROGRAMS_ERROR:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new program
router.post('/', protect, async (req, res) => {
  try {
    const defaultModules = [
      'dashboard', 'customers', 'products', 'quotations', 'invoices',
      'labour-bills', 'transport-bills', 'income', 'expense', 'accounts',
      'ledger', 'settings', 'notes', 'bill-upload'
    ];

    const program = new Program({
      enabledModules: defaultModules,
      ...req.body,
      owner: req.user._id
    });
    const saved = await program.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

const bcrypt = require('bcryptjs');

// Update program
router.put('/:id', protect, async (req, res) => {
  try {
    const program = await Program.findById(req.params.id);
    if (!program) return res.status(404).json({ message: 'Program workspace not found' });

    const isOwner = program.owner && program.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    const hasAccess = req.user.programAccess && req.user.programAccess.some(id => id.toString() === program._id.toString());
    const isShared = program.sharedUsers && program.sharedUsers.some(su => su.userId.toString() === req.user._id.toString());

    if (!isOwner && !isAdmin && !hasAccess && !isShared) {
      return res.status(403).json({ message: 'Not authorized to update this program' });
    }

    // Use $set to ensure Mongoose properly marks all fields as modified (esp. arrays)
    const updated = await Program.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: false }
    );

    res.json(updated);
  } catch (error) {
    console.error('PROGRAM_PUT_ERROR:', error);
    res.status(500).json({ message: 'Server error updating program' });
  }
});

// Delete program
router.delete('/:id', protect, async (req, res) => {
  const { password } = req.body;
  
  try {
    // 1. Verify Password
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password. Deletion cancelled.' });
    }

    // 2. Check if owner
    const program = await Program.findOne({ _id: req.params.id, owner: req.user._id });
    if (!program) {
      return res.status(404).json({ message: 'Program not found or you are not the owner' });
    }

    // 3. Delete
    await Program.deleteOne({ _id: req.params.id });
    
    // Optional: Delete all related data (Invoices, Customers, etc.)
    // For now, just delete the program entry
    
    res.json({ message: 'Program deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// WORKSPACE MANAGEMENT ROUTES (new — existing routes above are unchanged)
// ─────────────────────────────────────────────────────────────────────────────

// @route  POST /api/programs/:id/duplicate
// @desc   Create an independent copy of a program WITH all its data records.
//         If targetEmail provided, the copy is owned by that user.
router.post('/:id/duplicate', protect, async (req, res) => {
  try {
    const original = await Program.findById(req.params.id);
    if (!original) return res.status(404).json({ message: 'Program not found' });

    // Must be owner or admin
    const isOwner = original.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Access denied' });

    const { targetEmail } = req.body;
    let targetOwnerId = req.user._id;

    if (targetEmail) {
      const targetUser = await User.findOne({ email: targetEmail.toLowerCase().trim() });
      if (!targetUser) return res.status(404).json({ message: 'Target user not found. They must have an account.' });
      targetOwnerId = targetUser._id;
    }

    // ── 1. Copy the Program metadata ─────────────────────────────────────────
    const raw = original.toObject();
    delete raw._id;
    delete raw.__v;
    delete raw.createdAt;
    delete raw.updatedAt;
    delete raw.sharedUsers;

    const suffix = targetEmail ? '(Shared Copy)' : '(Copy)';
    const newProgram = await Program.create({
      ...raw,
      name: `${original.name} ${suffix}`,
      owner: targetOwnerId,
      parentProgramId: original._id,
      isDuplicate: true,
      status: 'active',
      sharedUsers: []
    });

    const oldProgramId = original._id;
    const newProgramId = newProgram._id;

    // Lazy require models to keep top of file clean
    const Customer      = require('../models/Customer');
    const Product       = require('../models/Product');
    const Account       = require('../models/Account');
    const Transaction   = require('../models/Transaction');
    const Invoice       = require('../models/Invoice');
    const Quotation     = require('../models/Quotation');
    const LabourBill    = require('../models/LabourBill');
    const Note          = require('../models/Note');
    const Document      = require('../models/Document');

    // ── Helper: copy a collection and return an old→new ID map ───────────────
    async function copyCollection(Model, extraOmit = []) {
      const docs = await Model.find({ programId: oldProgramId }).lean();
      const idMap = {};
      for (const doc of docs) {
        const oldId = doc._id.toString();
        const copy = { ...doc };
        delete copy._id;
        delete copy.__v;
        delete copy.createdAt;
        delete copy.updatedAt;
        for (const field of extraOmit) delete copy[field];
        copy.programId = newProgramId;
        const created = await Model.create(copy);
        idMap[oldId] = created._id;
      }
      return idMap;
    }

    // ── 2. Copy Customers ─────────────────────────────────────────────────────
    const customerIdMap = await copyCollection(Customer);

    // ── 3. Copy Products ──────────────────────────────────────────────────────
    const productIdMap = await copyCollection(Product);

    // ── 4. Copy Accounts — record old→new map for Transaction remapping ───────
    const accountIdMap = await copyCollection(Account);

    // ── 5. Copy Transactions (remap account & toAccount references) ───────────
    const txDocs = await Transaction.find({ programId: oldProgramId }).lean();
    for (const tx of txDocs) {
      const copy = { ...tx };
      delete copy._id;
      delete copy.__v;
      delete copy.createdAt;
      delete copy.updatedAt;
      copy.programId = newProgramId;
      if (copy.account)   copy.account   = accountIdMap[copy.account.toString()]   || copy.account;
      if (copy.toAccount) copy.toAccount = accountIdMap[copy.toAccount.toString()] || copy.toAccount;
      if (copy.party)     copy.party     = customerIdMap[copy.party.toString()]    || copy.party;
      await Transaction.create(copy);
    }

    // ── 6. Copy Invoices (remap customer + product refs) ──────────────────────
    const invoiceDocs = await Invoice.find({ programId: oldProgramId }).lean();
    for (const inv of invoiceDocs) {
      const copy = { ...inv };
      delete copy._id;
      delete copy.__v;
      delete copy.createdAt;
      delete copy.updatedAt;
      copy.programId = newProgramId;
      copy.customer  = customerIdMap[copy.customer?.toString()] || copy.customer;
      // Remap product refs inside line items
      if (Array.isArray(copy.items)) {
        copy.items = copy.items.map(item => {
          const i = { ...item };
          delete i._id;
          if (i.product) i.product = productIdMap[i.product.toString()] || i.product;
          return i;
        });
      }
      await Invoice.create(copy);
    }

    // ── 7. Copy Quotations ────────────────────────────────────────────────────
    const quotationDocs = await Quotation.find({ programId: oldProgramId }).lean();
    for (const q of quotationDocs) {
      const copy = { ...q };
      delete copy._id;
      delete copy.__v;
      delete copy.createdAt;
      delete copy.updatedAt;
      copy.programId = newProgramId;
      copy.customer  = customerIdMap[copy.customer?.toString()] || copy.customer;
      if (Array.isArray(copy.items)) {
        copy.items = copy.items.map(item => {
          const i = { ...item };
          delete i._id;
          if (i.product) i.product = productIdMap[i.product.toString()] || i.product;
          return i;
        });
      }
      await Quotation.create(copy);
    }

    // ── 8. Copy Labour Bills ──────────────────────────────────────────────────
    const labourDocs = await LabourBill.find({ programId: oldProgramId }).lean();
    for (const lb of labourDocs) {
      const copy = { ...lb };
      delete copy._id;
      delete copy.__v;
      delete copy.createdAt;
      delete copy.updatedAt;
      copy.programId = newProgramId;
      copy.customer  = customerIdMap[copy.customer?.toString()] || copy.customer;
      if (Array.isArray(copy.items)) {
        copy.items = copy.items.map(item => { const i = { ...item }; delete i._id; return i; });
      }
      await LabourBill.create(copy);
    }

    // ── 9. Copy Notes ─────────────────────────────────────────────────────────
    try {
      const noteDocs = await Note.find({ programId: oldProgramId }).lean();
      for (const n of noteDocs) {
        const copy = { ...n };
        delete copy._id; delete copy.__v; delete copy.createdAt; delete copy.updatedAt;
        copy.programId = newProgramId;
        await Note.create(copy);
      }
    } catch (_) { /* Note model may not exist in all versions */ }

    // ── 10. Copy Documents ────────────────────────────────────────────────────
    try {
      const docRecords = await Document.find({ programId: oldProgramId }).lean();
      for (const d of docRecords) {
        const copy = { ...d };
        delete copy._id; delete copy.__v; delete copy.createdAt; delete copy.updatedAt;
        copy.programId = newProgramId;
        await Document.create(copy);
      }
    } catch (_) { /* Document model may not exist in all versions */ }

    // ── 11. Grant programAccess to the target user if different ───────────────
    if (targetOwnerId.toString() !== req.user._id.toString()) {
      await User.findByIdAndUpdate(targetOwnerId, { $addToSet: { programAccess: newProgram._id } });
    }

    console.log(`[DUPLICATE] Program ${oldProgramId} → ${newProgramId} with all data copied.`);
    res.status(201).json(newProgram);
  } catch (error) {
    console.error('DUPLICATE_ERROR:', error);
    res.status(500).json({ message: error.message });
  }
});

// @route  POST /api/programs/:id/transfer
// @desc   Transfer program ownership to another registered user.
//         Body: { targetEmail, keepAccess: bool, duplicateAndTransfer: bool }
router.post('/:id/transfer', protect, async (req, res) => {
  try {
    const { targetEmail, keepAccess, duplicateAndTransfer } = req.body;
    if (!targetEmail) return res.status(400).json({ message: 'Target email is required' });

    const program = await Program.findOne({ _id: req.params.id, owner: req.user._id });
    if (!program) return res.status(404).json({ message: 'Program not found or you are not the owner' });

    const targetUser = await User.findOne({ email: targetEmail.toLowerCase().trim() });
    if (!targetUser) return res.status(404).json({ message: 'Target user not found. They must have an account.' });
    if (targetUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot transfer to yourself' });
    }

    if (duplicateAndTransfer) {
      // Create a copy and assign it to the target — original stays with current owner
      const raw = program.toObject();
      delete raw._id; delete raw.__v; delete raw.createdAt; delete raw.updatedAt; delete raw.sharedUsers;

      const copy = await Program.create({
        ...raw,
        name: `${program.name} (Transferred)`,
        owner: targetUser._id,
        parentProgramId: program._id,
        isDuplicate: true,
        status: 'active',
        sharedUsers: []
      });
      await User.findByIdAndUpdate(targetUser._id, { $addToSet: { programAccess: copy._id } });
      return res.json({ message: 'Program duplicated and transferred successfully', program: copy });
    }

    // Direct ownership transfer
    const prevOwner = program.owner;
    program.owner = targetUser._id;

    if (keepAccess) {
      // Keep the old owner in sharedUsers with viewer role
      const alreadyShared = program.sharedUsers.some(su => su.userId.toString() === prevOwner.toString());
      if (!alreadyShared) {
        program.sharedUsers.push({ userId: prevOwner, role: 'viewer', addedAt: new Date() });
      }
      await User.findByIdAndUpdate(prevOwner, { $addToSet: { programAccess: program._id } });
    }

    await program.save();
    await User.findByIdAndUpdate(targetUser._id, { $addToSet: { programAccess: program._id } });

    res.json({ message: 'Program transferred successfully', program });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route  POST /api/programs/:id/share
// @desc   Invite a registered user to collaborate with a specific role.
//         Body: { email, role }
router.post('/:id/share', protect, async (req, res) => {
  try {
    const { email, role } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const program = await Program.findById(req.params.id);
    if (!program) return res.status(404).json({ message: 'Program not found' });

    const isOwner = program.owner.toString() === req.user._id.toString();
    const isAdmin = program.sharedUsers.some(
      su => su.userId.toString() === req.user._id.toString() && su.role === 'admin'
    );
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Only the owner or an admin can share this program' });
    }

    const targetUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (!targetUser) return res.status(404).json({ message: 'User not found. They must register first.' });
    if (targetUser._id.toString() === program.owner.toString()) {
      return res.status(400).json({ message: 'This user is already the program owner' });
    }

    // Add or update role
    const existingIdx = program.sharedUsers.findIndex(su => su.userId.toString() === targetUser._id.toString());
    if (existingIdx >= 0) {
      program.sharedUsers[existingIdx].role = role || 'viewer';
    } else {
      program.sharedUsers.push({ userId: targetUser._id, role: role || 'viewer', addedAt: new Date() });
    }

    await User.findByIdAndUpdate(targetUser._id, { $addToSet: { programAccess: program._id } });
    await program.save();

    const populated = await Program.findById(program._id).populate('sharedUsers.userId', 'name email');
    res.json({ message: `Access granted to ${targetUser.name}`, program: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route  DELETE /api/programs/:id/share/:userId
// @desc   Revoke a user's access to this program.
router.delete('/:id/share/:userId', protect, async (req, res) => {
  try {
    const program = await Program.findById(req.params.id);
    if (!program) return res.status(404).json({ message: 'Program not found' });

    const isOwner = program.owner.toString() === req.user._id.toString();
    if (!isOwner) return res.status(403).json({ message: 'Only the owner can revoke access' });

    program.sharedUsers = program.sharedUsers.filter(
      su => su.userId.toString() !== req.params.userId
    );
    await program.save();
    await User.findByIdAndUpdate(req.params.userId, { $pull: { programAccess: program._id } });

    res.json({ message: 'Access revoked successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route  PUT /api/programs/:id/archive
// @desc   Archive or restore a program. Body: { status: 'active' | 'archived' }
router.put('/:id/archive', protect, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'archived'].includes(status)) {
      return res.status(400).json({ message: 'status must be "active" or "archived"' });
    }
    const program = await Program.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { status },
      { new: true }
    );
    if (!program) return res.status(404).json({ message: 'Program not found or access denied' });
    res.json(program);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

