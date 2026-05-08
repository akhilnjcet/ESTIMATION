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
    const account = await Account.create({ ...req.body, programId: req.programId });
    res.status(201).json(account);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
