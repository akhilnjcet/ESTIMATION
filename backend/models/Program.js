const mongoose = require('mongoose');

const programSchema = new mongoose.Schema({
  // ── Existing fields (unchanged) ──────────────────────────────────────────
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
  defaultTerms: {
    type: String,
    default: '1. Goods once sold will not be taken back.\n2. Please check items before acceptance.\n3. Payment should be made within the due date.'
  },
  showTermsByDefault: { type: Boolean, default: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  /** List of module IDs enabled for this program workspace */
  enabledModules: [{ type: String }],

  // ── New fields for Workspace Management (all optional / backward-compatible) ──
  /** If this program was duplicated, points to the source program */
  parentProgramId: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', default: null },

  /** True when this program is a copy created via Duplicate */
  isDuplicate: { type: Boolean, default: false },

  /** 'active' | 'archived' — archived programs are hidden from the switcher */
  status: { type: String, enum: ['active', 'archived'], default: 'active' },

  /**
   * Fine-grained per-user permission roles for this program.
   * The owner always has full access; this array tracks explicitly shared users
   * and their roles for display in the Share panel.
   */
  sharedUsers: [{
    userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: {
      type: String,
      enum: ['admin', 'manager', 'editor', 'accountant', 'sales', 'staff', 'viewer'],
      default: 'viewer'
    },
    addedAt: { type: Date, default: Date.now }
  }]

}, { timestamps: true });

module.exports = mongoose.model('Program', programSchema);
