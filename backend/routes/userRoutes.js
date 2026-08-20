const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { protect } = require('../middleware/authMiddleware');

// Helper to check if requester can manage the target user
const canManage = (requester, targetUser) => {
  if (requester.role === 'admin') return true;
  if (targetUser.createdBy && targetUser.createdBy.toString() === requester._id.toString()) return true;
  return false;
};

// @route   GET /api/users
// @desc    Get all users (for Login Manager)
router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== 'admin') {
      query = { createdBy: req.user._id };
    }
    
    const users = await User.find(query)
      .populate('programAccess', 'name')
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// @route   POST /api/users
// @desc    Create a new login user
router.post('/', protect, async (req, res) => {
  let { name, email, password, role, programAccess, isActive } = req.body;
  try {
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, Email/Username, and Password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) return res.status(400).json({ message: 'A user with this email/username already exists' });

    // Restrict role for non-admins
    if (req.user.role !== 'admin') {
      role = 'viewer'; // Force viewer role
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: cleanEmail,
      password: hashedPassword,
      role: role || 'viewer',
      programAccess: programAccess || [],
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user.role !== 'admin' ? req.user._id : undefined
    });

    const createdUser = await User.findById(user._id).populate('programAccess', 'name').select('-password');
    res.status(201).json(createdUser);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user (change name, email/username, password, role, program access, status)
router.put('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User account not found' });

    if (!canManage(req.user, user)) {
      return res.status(403).json({ message: 'Not authorized to manage this user' });
    }

    let { name, email, password, role, programAccess, isActive } = req.body;

    if (name) user.name = name;
    if (email) {
      const cleanEmail = email.toLowerCase().trim();
      const existing = await User.findOne({ email: cleanEmail, _id: { $ne: req.params.id } });
      if (existing) return res.status(400).json({ message: 'Email/username is already in use by another user' });
      user.email = cleanEmail;
    }
    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }
    
    // Restrict role changes for non-admins
    if (req.user.role !== 'admin' && role) {
      user.role = 'viewer';
    } else if (role) {
      user.role = role;
    }

    if (programAccess !== undefined) user.programAccess = programAccess;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    const updatedUser = await User.findById(user._id).populate('programAccess', 'name').select('-password');
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// @route   PUT /api/users/:id/change-password
// @desc    Direct password reset for an account
router.put('/:id/change-password', protect, async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ message: 'Password must be at least 4 characters long' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User account not found' });

    if (!canManage(req.user, user)) {
      return res.status(403).json({ message: 'Not authorized to change password for this user' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: `Password changed successfully for ${user.name}` });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user login
router.delete('/:id', protect, async (req, res) => {
  try {
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ message: 'You cannot delete your own logged-in account' });
    }
    
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User account not found' });

    if (!canManage(req.user, user)) {
      return res.status(403).json({ message: 'Not authorized to delete this user' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User login account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

module.exports = router;
