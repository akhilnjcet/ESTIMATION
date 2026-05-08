const express = require('express');
const router = express.Router();
const BusinessSettings = require('../models/BusinessSettings');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/settings
// @desc    Get business settings
router.get('/', protect, async (req, res) => {
  try {
    let settings = await BusinessSettings.findOne();
    if (!settings) {
      settings = await BusinessSettings.create({});
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/settings
// @desc    Update business settings
router.put('/', protect, async (req, res) => {
  try {
    let settings = await BusinessSettings.findOne();
    
    // Remove _id from payload to prevent Mongoose immutable error
    const payload = { ...req.body };
    delete payload._id;
    delete payload.__v;

    const updated = await BusinessSettings.findOneAndUpdate(
      {},
      { $set: payload },
      { new: true, upsert: true }
    );
    res.json(updated);
  } catch (error) {
    console.error('Settings update error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

module.exports = router;
