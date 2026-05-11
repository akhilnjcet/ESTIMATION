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

const bcrypt = require('bcryptjs');

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

// Delete program
router.delete('/:id', protect, async (req, res) => {
  const { password } = req.body;
  
  try {
    // 1. Verify Password
    const isMatch = await bcrypt.compare(password, req.user.password);
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

module.exports = router;
