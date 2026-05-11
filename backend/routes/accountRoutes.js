const express = require('express');
const router = express.Router();
const Account = require('../models/Account');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/accounts
// @desc    Get all accounts and balances
router.get('/', protect, async (req, res) => {
  try {
    const query = req.programId ? { programId: req.programId } : {};
    const accounts = await Account.find(query);
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/accounts
// @desc    Create a new account
router.post('/', protect, async (req, res) => {
  try {
    if (!req.programId) return res.status(400).json({ message: 'No program selected' });
    const { openingBalance, balance, ...rest } = req.body;
    
    // Set current balance to opening balance if not provided
    const initialBalance = balance || openingBalance || 0;
    
    const account = await Account.create({ 
      ...rest, 
      openingBalance: openingBalance || 0,
      balance: initialBalance,
      programId: req.programId 
    });
    res.status(201).json(account);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/accounts/:id
// @desc    Update an account
router.put('/:id', protect, async (req, res) => {
  try {
    const oldAccount = await Account.findOne({ _id: req.params.id, programId: req.programId });
    if (!oldAccount) return res.status(404).json({ message: 'Account not found' });

    const updates = { ...req.body };
    
    // If openingBalance is being updated, adjust current balance by the difference
    if (updates.openingBalance !== undefined) {
      const diff = Number(updates.openingBalance) - oldAccount.openingBalance;
      updates.balance = oldAccount.balance + diff;
    }

    const account = await Account.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
    );
    
    res.json(account);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/accounts/:id
// @desc    Delete an account
router.delete('/:id', protect, async (req, res) => {
  try {
    const account = await Account.findOneAndDelete({ _id: req.params.id, programId: req.programId });
    if (!account) return res.status(404).json({ message: 'Account not found' });
    res.json({ message: 'Account deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
