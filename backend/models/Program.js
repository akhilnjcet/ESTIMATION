const mongoose = require('mongoose');

const programSchema = new mongoose.Schema({
  name: { type: String, required: true },
  logo: { type: String },
  showLogo: { type: Boolean, default: true },
  address: { type: String },
  phone: { type: String },
  email: { type: String },
  gstNumber: { type: String },
  themeColor: { type: String, default: '#4f46e5' },
  footerText: { type: String },
  qrCodeUrl: { type: String },
  signatureUrl: { type: String },
  signatureTitle: { type: String, default: 'Authorized Signature' },
  treasurerSignatureUrl: { type: String },
  treasurerSignatureTitle: { type: String, default: 'Treasurer' },
  showTreasurerSignature: { type: Boolean, default: true },
  defaultTerms: { type: String, default: '1. Goods once sold will not be taken back.\n2. Please check items before acceptance.\n3. Payment should be made within the due date.' },
  showTermsByDefault: { type: Boolean, default: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Program', programSchema);
