const mongoose = require('mongoose');

const transactionSyncSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  transactionRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    required: true
  },
  programId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Program',
    required: true
  },
  mongodbStatus: {
    type: String,
    enum: ['Pending', 'Saved', 'Failed'],
    default: 'Pending'
  },
  excelStatus: {
    type: String,
    enum: ['Pending', 'Synced', 'Failed'],
    default: 'Pending'
  },
  retryCount: {
    type: Number,
    default: 0
  },
  lastAttemptAt: {
    type: Date
  },
  lastSuccessAt: {
    type: Date
  },
  errorMessage: {
    type: String
  }
}, { timestamps: true });

transactionSyncSchema.index({ transactionId: 1 });
transactionSyncSchema.index({ mongodbStatus: 1 });
transactionSyncSchema.index({ excelStatus: 1 });

module.exports = mongoose.model('TransactionSync', transactionSyncSchema);
