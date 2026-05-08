const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  programId: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
  type: {
    type: String,
    enum: ['Income', 'Expense', 'Transfer'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },
  // If Transfer, we need a toAccount
  toAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account'
  },
  category: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  date: {
    type: Date,
    default: Date.now
  },
  receiptUrl: {
    type: String
  },
  party: {
    // Optional link to Customer/Supplier for Ledger tracking
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  status: {
    type: String,
    enum: ['Cleared', 'Pending', 'Due', 'Approved'],
    default: 'Cleared'
  },
  editCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Transaction', transactionSchema);
