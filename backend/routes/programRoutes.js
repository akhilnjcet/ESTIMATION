const express = require('express');
const router = express.Router();
const Program = require('../models/Program');
const { protect } = require('../middleware/authMiddleware');

// Get all programs for the logged-in user
router.get('/', protect, async (req, res) => {
  try {
    const programs = await Program.find({
      $or: [
        { owner: req.user._id },
        { _id: { $in: req.user.programAccess } }
      ]
    });
    res.json(programs);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new program
router.post('/', protect, async (req, res) => {
  try {
    const program = new Program({
      ...req.body,
      owner: req.user._id
    });
    const saved = await program.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update program
router.put('/:id', protect, async (req, res) => {
  try {
    const updated = await Program.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
