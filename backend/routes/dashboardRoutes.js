const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const Program = require('../models/Program');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/dashboard/combined
// @desc    Get aggregated data across all programs
router.get('/combined', protect, async (req, res) => {
  try {
    let programIds = [];
    if (req.user.role === 'admin') {
      const programs = await Program.find({ owner: req.user._id });
      programIds = programs.map(p => p._id);
    } else {
      programIds = req.user.programAccess;
    }

    // Aggregates
    const totals = await Transaction.aggregate([
      { $match: { programId: { $in: programIds } } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' }
        }
      }
    ]);

    const income = totals.find(t => t._id === 'Income')?.total || 0;
    const expense = totals.find(t => t._id === 'Expense')?.total || 0;
    const balance = income - expense;

    // Account-wise totals
    const accounts = await Account.find({ programId: { $in: programIds } });
    const cashBalance = accounts.filter(a => a.type === 'Cash').reduce((sum, a) => sum + a.balance, 0);
    const bankBalance = accounts.filter(a => a.type === 'Bank').reduce((sum, a) => sum + a.balance, 0);
    const upiBalance = accounts.filter(a => a.type === 'UPI').reduce((sum, a) => sum + a.balance, 0);

    // Program-wise Summary
    const programSummaries = await Promise.all(programIds.map(async (id) => {
      const prog = await Program.findById(id);
      const progIncome = await Transaction.aggregate([
        { $match: { programId: id, type: 'Income' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      const progExpense = await Transaction.aggregate([
        { $match: { programId: id, type: 'Expense' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      return {
        _id: prog._id,
        name: prog.name,
        income: progIncome[0]?.total || 0,
        expense: progExpense[0]?.total || 0,
        balance: (progIncome[0]?.total || 0) - (progExpense[0]?.total || 0)
      };
    }));

    res.json({
      combined: {
        income,
        expense,
        balance,
        cashBalance,
        bankBalance,
        upiBalance
      },
      programSummaries
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
