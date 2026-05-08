const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  programId: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['Cash', 'Bank', 'UPI', 'Other'],
    required: true
  },
  balance: {
    type: Number,
    default: 0
  },
  accountNumber: {
    type: String
  },
  bankName: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Account', accountSchema);
