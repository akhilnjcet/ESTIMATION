const express = require('express');
const router = express.Router();
const Staff = require('../models/Staff');
const Program = require('../models/Program');
const { protect } = require('../middleware/authMiddleware');

// Get all staff for the program
router.get('/', protect, async (req, res) => {
  try {
    const filter = req.programId ? { programId: req.programId } : {};
    const staff = await Staff.find(filter).sort({ createdAt: -1 });
    res.json(staff);
  } catch (error) {
    console.error('FETCH_STAFF_ERROR:', error);
    res.status(500).json({ message: error.message });
  }
});

// Helper to generate initials from program name
const getInitials = (name) => {
  if (!name) return 'ID';
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].substring(0, 3).toUpperCase();
  return words.slice(0, 3).map(w => w[0]).join('').toUpperCase();
};

// Create new staff
router.post('/', protect, async (req, res) => {
  try {
    if (!req.programId) return res.status(400).json({ message: 'No program selected' });

    const { name, contactNumber, designation, memberOf, expiryDate, isActive } = req.body;

    // Get program to generate memberId
    const program = await Program.findById(req.programId);
    const prefix = getInitials(program?.name) + '-';
    
    // Find highest existing ID to increment
    const lastStaff = await Staff.findOne({ programId: req.programId }).sort({ createdAt: -1 });
    let nextNum = 1;
    if (lastStaff && lastStaff.memberId) {
      const parts = lastStaff.memberId.split('-');
      const lastNum = parseInt(parts[parts.length - 1]);
      if (!isNaN(lastNum)) {
        nextNum = lastNum + 1;
      }
    }
    
    const memberId = `${prefix}${nextNum.toString().padStart(4, '0')}`;

    const newStaff = new Staff({
      programId: req.programId,
      memberId,
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
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Update staff
router.put('/:id', protect, async (req, res) => {
  try {
    const { name, contactNumber, designation, memberOf, expiryDate, isActive } = req.body;
    
    const updateData = {
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
    
    if (!updatedStaff) return res.status(404).json({ message: 'Staff member not found' });
    res.json(updatedStaff);
  } catch (error) {
    console.error('UPDATE_STAFF_ERROR:', error);
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
