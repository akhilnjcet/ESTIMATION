const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/transactions
// @desc    Get transactions (filter by type, account, etc)
router.get('/', protect, async (req, res) => {
  try {
    if (!req.programId) return res.status(400).json({ message: 'No program selected' });
    const filter = { programId: req.programId };
    if (req.query.type) filter.type = req.query.type;
    
    const transactions = await Transaction.find(filter)
      .populate('account', 'name type')
      .populate('party', 'customerName')
      .sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/transactions
// @desc    Add Income or Expense
router.post('/', protect, async (req, res) => {
  try {
    if (!req.programId) return res.status(400).json({ message: 'No program selected' });
    
    const { type, amount, account, category, description, date, party } = req.body;

    const transaction = new Transaction({
      type, amount, account, category, description, date, party,
      programId: req.programId
    });

    await transaction.save();

    // Update Account Balance
    const acc = await Account.findById(account);
    if (!acc) throw new Error('Account not found');

    if (type === 'Income') {
      acc.balance += Number(amount);
    } else if (type === 'Expense') {
      acc.balance -= Number(amount);
    }

    await acc.save();

    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

module.exports = router;
