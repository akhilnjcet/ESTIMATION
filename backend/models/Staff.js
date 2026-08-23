const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  programId: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
  memberId: { type: String, required: true },
  name: { type: String, required: true },
  contactNumber: { type: String, required: true },
  designation: { type: String, required: true },
  memberOf: { type: String },
  expiryDate: { type: Date },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Compound index to ensure memberId is unique per program
staffSchema.index({ programId: 1, memberId: 1 }, { unique: true });

module.exports = mongoose.model('Staff', staffSchema);
