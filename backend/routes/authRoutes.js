const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { protect } = require('../middleware/authMiddleware');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super_secret_estimation_key_2026', {
    expiresIn: '30d',
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      name,
      email,
      password: hashedPassword,
    });

    const savedUser = await user.save();

    // Create default program for the new user
    const Program = require('../models/Program');
    const defaultProgram = await Program.create({
      name: `${name}'s Program`,
      owner: savedUser._id,
      email: savedUser.email
    });

    // Link program to user
    savedUser.programAccess = [defaultProgram._id];
    await savedUser.save();

    if (savedUser) {
      res.status(201).json({
        _id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role,
        token: generateToken(savedUser._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('REGISTER_ERROR:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// @route   POST /api/auth/login
// @desc    Auth user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('LOGIN_ERROR:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// @route   GET /api/auth/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

const { sendOtpEmail } = require('../utils/emailHelper');

// @route   POST /api/auth/forgot-password
// @desc    Request password reset OTP
// @access  Public
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ message: 'User with this email does not exist' });
    }

    // Generate secure 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP in user document
    user.resetOtp = otp;
    user.resetOtpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes
    user.resetOtpAttempts = 0;
    user.resetOtpVerified = false;
    await user.save();

    // Send email
    const previewUrl = await sendOtpEmail(user.email, otp);

    res.json({ 
      message: 'OTP sent successfully to your email address.',
      ...(previewUrl && { testPreviewUrl: previewUrl }) // Include preview URL for test console convenience
    });
  } catch (error) {
    console.error('FORGOT_PASSWORD_ERROR:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP for password reset
// @access  Public
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  try {
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Ensure OTP exists and has not expired
    if (!user.resetOtp || !user.resetOtpExpires) {
      return res.status(400).json({ message: 'No active OTP request found. Please request a new OTP.' });
    }

    if (user.resetOtpExpires < Date.now()) {
      // Clear expired OTP
      user.resetOtp = undefined;
      user.resetOtpExpires = undefined;
      user.resetOtpAttempts = 0;
      user.resetOtpVerified = false;
      await user.save();
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    // Ensure they have not exceeded max attempts (3)
    if (user.resetOtpAttempts >= 3) {
      // Invalidate OTP
      user.resetOtp = undefined;
      user.resetOtpExpires = undefined;
      user.resetOtpAttempts = 0;
      user.resetOtpVerified = false;
      await user.save();
      return res.status(400).json({ message: 'Max attempts exceeded. Please request a new OTP.' });
    }

    // Check OTP
    if (user.resetOtp !== otp.trim()) {
      user.resetOtpAttempts += 1;
      const remaining = 3 - user.resetOtpAttempts;
      
      if (remaining <= 0) {
        user.resetOtp = undefined;
        user.resetOtpExpires = undefined;
        user.resetOtpAttempts = 0;
        user.resetOtpVerified = false;
        await user.save();
        return res.status(400).json({ message: 'Invalid OTP. Max attempts exceeded. Please request a new OTP.' });
      }
      
      await user.save();
      return res.status(400).json({ message: `Invalid OTP. You have ${remaining} attempts remaining.` });
    }

    // OTP is valid
    user.resetOtpVerified = true;
    await user.save();

    res.json({ message: 'OTP verified successfully. You can now reset your password.' });
  } catch (error) {
    console.error('VERIFY_OTP_ERROR:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password using verified OTP session
// @access  Public
router.post('/reset-password', async (req, res) => {
  const { email, password, confirmPassword } = req.body;

  try {
    if (!email || !password || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Ensure OTP verified session is valid
    if (!user.resetOtpVerified || !user.resetOtpExpires || user.resetOtpExpires < Date.now()) {
      return res.status(401).json({ message: 'Unauthorized. Please request and verify OTP first.' });
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ 
        message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (e.g. @$!%*?&).' 
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save user password and clear OTP fields
    user.password = hashedPassword;
    user.resetOtp = undefined;
    user.resetOtpExpires = undefined;
    user.resetOtpAttempts = 0;
    user.resetOtpVerified = false;
    await user.save();

    res.json({ message: 'Password reset successful. You can now log in.' });
  } catch (error) {
    console.error('RESET_PASSWORD_ERROR:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

module.exports = router;
