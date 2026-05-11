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
    const { type, sortBy } = req.query;
    const filter = { programId: req.programId };
    if (type) filter.type = type;
    
    let sortOptions = { date: -1, createdAt: -1 };
    if (sortBy === 'date_asc') sortOptions = { date: 1, createdAt: 1 };
    if (sortBy === 'amount_desc') sortOptions = { amount: -1 };
    if (sortBy === 'amount_asc') sortOptions = { amount: 1 };
    
    const transactions = await Transaction.find(filter)
      .populate('account', 'name type')
      .populate('party', 'customerName')
      .sort(sortOptions);
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/transactions
// @desc    Add Income, Expense or Transfer
router.post('/', protect, async (req, res) => {
  try {
    if (!req.programId) return res.status(400).json({ message: 'No program selected' });
    
    const { type, amount, account, toAccount, category, description, date, party } = req.body;

    const transaction = new Transaction({
      type, amount, account, toAccount, category, description, date, party,
      programId: req.programId
    });

    await transaction.save();

    // Update Account Balance
    if (type === 'Transfer') {
      if (!toAccount) throw new Error('toAccount is required for transfers');
      
      const fromAcc = await Account.findById(account);
      const targetAcc = await Account.findById(toAccount);
      
      if (!fromAcc || !targetAcc) throw new Error('One or both accounts not found');
      
      fromAcc.balance -= Number(amount);
      targetAcc.balance += Number(amount);
      
      await fromAcc.save();
      await targetAcc.save();
    } else {
      const acc = await Account.findById(account);
      if (!acc) throw new Error('Account not found');

      if (type === 'Income') {
        acc.balance += Number(amount);
      } else if (type === 'Expense') {
        acc.balance -= Number(amount);
      }
      await acc.save();
    }

    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const oldTransaction = await Transaction.findById(req.params.id);
    if (!oldTransaction) return res.status(404).json({ message: 'Transaction not found' });

    const { amount, account, type } = req.body;
    
    // If amount or account or type changed, we need to revert old balance and apply new
    if (amount !== undefined || account !== undefined || type !== undefined) {
      const acc = await Account.findById(oldTransaction.account);
      if (acc) {
        // Revert old
        if (oldTransaction.type === 'Income') acc.balance -= oldTransaction.amount;
        else acc.balance += oldTransaction.amount;
        await acc.save();
      }

      // Apply new
      const targetAccId = account || oldTransaction.account;
      const targetAcc = await Account.findById(targetAccId);
      if (targetAcc) {
        const targetType = type || oldTransaction.type;
        const targetAmount = amount !== undefined ? Number(amount) : oldTransaction.amount;
        
        if (targetType === 'Income') targetAcc.balance += targetAmount;
        else targetAcc.balance -= targetAmount;
        await targetAcc.save();
      }
    }

    const updatedTransaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      { $set: req.body, $inc: { editCount: 1 } },
      { new: true }
    );

    res.json(updatedTransaction);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Not found' });

    const acc = await Account.findById(transaction.account);
    if (acc) {
      if (transaction.type === 'Income') acc.balance -= transaction.amount;
      else acc.balance += transaction.amount;
      await acc.save();
    }

    await Transaction.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
