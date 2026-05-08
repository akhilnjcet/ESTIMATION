const mongoose = require('mongoose');

const programSchema = new mongoose.Schema({
  name: { type: String, required: true },
  logo: { type: String },
  address: { type: String },
  phone: { type: String },
  email: { type: String },
  gstNumber: { type: String },
  themeColor: { type: String, default: '#4f46e5' },
  footerText: { type: String },
  qrCodeUrl: { type: String },
  signatureUrl: { type: String },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Program', programSchema);
