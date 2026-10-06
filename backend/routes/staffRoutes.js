const express = require('express');
const router = express.Router();
const Staff = require('../models/Staff');
const Program = require('../models/Program');
const { protect } = require('../middleware/authMiddleware');

const Transaction = require('../models/Transaction');

// Get all staff for the program
router.get('/', protect, async (req, res) => {
  try {
    const filter = req.programId ? { programId: req.programId } : {};
    const staff = await Staff.find(filter).sort({ createdAt: -1 });

    // Auto-fix legacy typo member IDs (e.g. Y[V- -> YUV-)
    for (const s of staff) {
      if (s.memberId && s.memberId.includes('Y[V-')) {
        s.memberId = s.memberId.replace('Y[V-', 'YUV-');
        await s.save();
        await Transaction.updateMany(
          { partyMember: s._id },
          { $set: { partyName: `${s.name} (${s.memberId})` } }
        );
      }
    }

    res.json(staff);
  } catch (error) {
    console.error('FETCH_STAFF_ERROR:', error);
    res.status(500).json({ message: error.message });
  }
});

// Helper to generate clean initials from program name
const getInitials = (name) => {
  if (!name) return 'YUV';
  const cleanName = name.replace(/\[.*?\]/g, '').replace(/[^a-zA-Z0-9\s]/g, '').trim();
  const words = cleanName.split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'YUV';
  if (words[0].length >= 3) return words[0].substring(0, 3).toUpperCase();
  return words.slice(0, 3).map(w => w[0]).join('').toUpperCase();
};

// Create new staff
router.post('/', protect, async (req, res) => {
  try {
    if (!req.programId) return res.status(400).json({ message: 'No program selected' });

    const { memberId: customMemberId, name, contactNumber, designation, memberOf, expiryDate, isActive } = req.body;

    let finalMemberId = customMemberId ? customMemberId.trim() : '';

    if (!finalMemberId) {
      const program = await Program.findById(req.programId);
      const prefix = getInitials(program?.name) + '-';
      
      const lastStaff = await Staff.findOne({ programId: req.programId }).sort({ createdAt: -1 });
      let nextNum = 1;
      if (lastStaff && lastStaff.memberId) {
        const parts = lastStaff.memberId.split('-');
        const lastNum = parseInt(parts[parts.length - 1]);
        if (!isNaN(lastNum)) {
          nextNum = lastNum + 1;
        }
      }
      finalMemberId = `${prefix}${nextNum.toString().padStart(4, '0')}`;
    } else {
      const existing = await Staff.findOne({ programId: req.programId, memberId: finalMemberId });
      if (existing) {
        return res.status(400).json({ message: `Member ID "${finalMemberId}" already exists in this workspace.` });
      }
    }

    const newStaff = new Staff({
      programId: req.programId,
      memberId: finalMemberId,
      name,
      contactNumber,
      designation,
      memberOf,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      isActive: isActive !== undefined ? isActive : true
    });

    const createdStaff = await newStaff.save();
    res.status(201).json(createdStaff);
  } catch (error) {
    console.error('CREATE_STAFF_ERROR:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Member ID already exists in this workspace.' });
    }
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Update staff
router.put('/:id', protect, async (req, res) => {
  try {
    const { memberId: customMemberId, name, contactNumber, designation, memberOf, expiryDate, isActive } = req.body;
    
    const existingStaff = await Staff.findOne({ _id: req.params.id, programId: req.programId });
    if (!existingStaff) return res.status(404).json({ message: 'Staff member not found' });

    let finalMemberId = existingStaff.memberId;
    if (customMemberId && customMemberId.trim() !== existingStaff.memberId) {
      const trimmed = customMemberId.trim();
      const duplicate = await Staff.findOne({ 
        programId: req.programId, 
        memberId: trimmed, 
        _id: { $ne: req.params.id } 
      });
      if (duplicate) {
        return res.status(400).json({ message: `Member ID "${trimmed}" is already assigned to another member.` });
      }
      finalMemberId = trimmed;
    }

    const updateData = {
      memberId: finalMemberId,
      name,
      contactNumber,
      designation,
      memberOf,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      isActive
    };

    const updatedStaff = await Staff.findOneAndUpdate(
      { _id: req.params.id, programId: req.programId },
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    // Update linked transactions with updated name and member ID
    await Transaction.updateMany(
      { partyMember: updatedStaff._id },
      { $set: { partyName: `${updatedStaff.name} (${updatedStaff.memberId})` } }
    );

    res.json(updatedStaff);
  } catch (error) {
    console.error('UPDATE_STAFF_ERROR:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Member ID already exists in this workspace.' });
    }
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Delete staff
router.delete('/:id', protect, async (req, res) => {
  try {
    const deletedStaff = await Staff.findOneAndDelete({ _id: req.params.id, programId: req.programId });
    if (!deletedStaff) return res.status(404).json({ message: 'Staff member not found' });
    res.json({ message: 'Staff member deleted successfully' });
  } catch (error) {
    console.error('DELETE_STAFF_ERROR:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
