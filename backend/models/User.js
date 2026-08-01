const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'accountant', 'sales', 'viewer'],
    default: 'viewer'
  },
  programAccess: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Program'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  resetOtp: {
    type: String
  },
  resetOtpExpires: {
    type: Date
  },
  resetOtpAttempts: {
    type: Number,
    default: 0
  },
  resetOtpVerified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
