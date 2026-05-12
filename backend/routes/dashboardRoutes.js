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

    if (programIds.length === 0) {
      return res.json({ combined: { income: 0, expense: 0, balance: 0, cashBalance: 0, bankBalance: 0, upiBalance: 0 }, programSummaries: [] });
    }

    // 1. Aggregates for all programs at once
    const allTotals = await Transaction.aggregate([
      { $match: { programId: { $in: programIds } } },
      {
        $group: {
          _id: { programId: '$programId', type: '$type' },
          total: { $sum: '$amount' }
        }
      }
    ]);

    // 2. Account balances for all programs at once
    const allAccounts = await Account.find({ programId: { $in: programIds } });
    
    // Process results
    const programDataMap = {};
    programIds.forEach(id => {
      programDataMap[id.toString()] = { income: 0, expense: 0, balance: 0 };
    });

    allTotals.forEach(t => {
      const pid = t._id.programId.toString();
      if (programDataMap[pid]) {
        if (t._id.type === 'Income') programDataMap[pid].income = t.total;
        if (t._id.type === 'Expense') programDataMap[pid].expense = t.total;
      }
    });

    let globalCash = 0, globalBank = 0, globalUpi = 0;
    allAccounts.forEach(acc => {
      const pid = acc.programId.toString();
      if (programDataMap[pid]) {
        programDataMap[pid].balance += acc.balance;
      }
      if (acc.type === 'Cash') globalCash += acc.balance;
      else if (acc.type === 'Bank') globalBank += acc.balance;
      else if (acc.type === 'UPI') globalUpi += acc.balance;
    });

    // Get Program names
    const programsInfo = await Program.find({ _id: { $in: programIds } }, 'name');
    
    const programSummaries = programsInfo.map(p => ({
      _id: p._id,
      name: p.name,
      ...programDataMap[p._id.toString()]
    }));

    const globalIncome = Object.values(programDataMap).reduce((sum, p) => sum + p.income, 0);
    const globalExpense = Object.values(programDataMap).reduce((sum, p) => sum + p.expense, 0);
    const globalBalance = globalCash + globalBank + globalUpi;

    res.json({
      combined: {
        income: globalIncome,
        expense: globalExpense,
        balance: globalBalance,
        cashBalance: globalCash,
        bankBalance: globalBank,
        upiBalance: globalUpi
      },
      programSummaries
    });
  } catch (error) {
    console.error('DASHBOARD_ERROR:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

module.exports = router;
