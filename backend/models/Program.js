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

  // ── Rental Settings ──────────────────────────────────────────────
  rentalPrefix: { type: String, default: 'RENT-' },
  rentalNextNumber: { type: Number, default: 1 },
  rentalDefaultTerms: { 
    type: String, 
    default: '1. ഉപകരണം വാടകയ്ക്ക് നൽകുന്നതിന് മുമ്പ് ഉപകരണത്തിന്റെ നിലവാരം പരിശോധിച്ച് ഉപഭോക്താവിന് കൈമാറുന്നതാണ്.\n2. ഉപകരണം കൈപ്പറ്റിയതിന് ശേഷം അതിന്റെ സുരക്ഷ, ശരിയായ ഉപയോഗം, പരിപാലനം എന്നിവയുടെ പൂർണ്ണ ഉത്തരവാദിത്വം ഉപഭോക്താവിനായിരിക്കും.\n3. വാടക കാലയളവിൽ ഉപകരണത്തിന് ഉണ്ടാകുന്ന നഷ്ടം, പൊട്ടൽ, കേടുപാട്, തെറ്റായ ഉപയോഗം, ദുരുപയോഗം അല്ലെങ്കിൽ നഷ്ടപ്പെടൽ എന്നിവയ്ക്ക് ഉപഭോക്താവ് ഉത്തരവാദിയായിരിക്കും.\n4. സാധാരണ ഉപയോഗത്തിലൂടെ ഉണ്ടാകുന്ന സ്വാഭാവിക തേയ്മാനം ഒഴികെയുള്ള കേടുപാടുകളുടെ അറ്റകുറ്റപ്പണി ചെലവ് ഉപഭോക്താവിൽ നിന്ന് ഈടാക്കുന്നതാണ്.\n5. ഉപകരണം നിശ്ചയിച്ച തീയതിയിലും സമയത്തും തിരികെ നൽകേണ്ടതാണ്. വൈകിയാൽ അധിക വാടക ഈടാക്കുന്നതാണ്.\n6. ഉപകരണം തിരികെ നൽകുമ്പോൾ, കൈമാറിയ സമയത്തെ അതേ അവസ്ഥയിൽ തന്നെ തിരികെ നൽകേണ്ടതാണ്.\n7. വാടകയ്ക്ക് എടുത്ത ഉപകരണം വാടകദാതാവിന്റെ മുൻകൂർ അനുമതിയില്ലാതെ മറ്റൊരാൾക്ക് കൈമാറുകയോ ഉപയോഗിക്കാൻ നൽകുകയോ ചെയ്യാൻ പാടില്ല.\n8. ഉപകരണം വാടകയ്ക്ക് എടുത്ത ആവശ്യത്തിനല്ലാതെ മറ്റേതെങ്കിലും ആവശ്യത്തിന് ഉപയോഗിക്കുന്നതിന് മുൻകൂർ അനുമതി വാങ്ങേണ്ടതാണ്.\n9. ഉപകരണം നഷ്ടപ്പെട്ടാൽ, ഉപകരണത്തിന്റെ നിലവിലെ replacement cost / ബാധകമായ നഷ്ടപരിഹാര തുക ഉപഭോക്താവിൽ നിന്ന് ഈടാക്കുന്നതാണ്.\n10. ആവശ്യമായ Security Deposit / Advance വാടകയ്ക്ക് മുമ്പ് നൽകേണ്ടതാണ്. ബാധകമായ കുടിശ്ശികകളോ നഷ്ടപരിഹാരമോ ഇല്ലെങ്കിൽ, ഉപകരണം സുരക്ഷിതമായി തിരികെ നൽകിയ ശേഷം Security Deposit തിരികെ നൽകുന്നതാണ്.\n11. വാടക തുക ഉപകരണം കൈപ്പറ്റുന്ന സമയത്തോ കരാറിൽ നിശ്ചയിച്ചിരിക്കുന്ന സമയത്തോ അടയ്ക്കേണ്ടതാണ്.\n12. ഉപകരണത്തിന്റെ തെറ്റായ ഉപയോഗം, ദുരുപയോഗം, അശ്രദ്ധ എന്നിവ മൂലം ഉണ്ടാകുന്ന അപകടങ്ങൾക്കും നാശനഷ്ടങ്ങൾക്കും വാടകദാതാവ് ഉത്തരവാദിയായിരിക്കില്ല.\n13. ഉപകരണം തിരികെ സ്വീകരിച്ച ശേഷം പരിശോധന നടത്തുന്നതാണ്. പരിശോധനയിൽ അധിക കേടുപാടുകൾ കണ്ടെത്തിയാൽ, അതിനുള്ള യുക്തിസഹമായ അറ്റകുറ്റപ്പണി/നഷ്ടപരിഹാര ചെലവ് ഉപഭോക്താവിൽ നിന്ന് ഈടാക്കുന്നതാണ്.\n14. ഉപകരണം സ്വീകരിക്കുന്നതിലൂടെ, ഉപഭോക്താവ് മുകളിൽ പറഞ്ഞ എല്ലാ വാടക നിബന്ധനകളും വ്യവസ്ഥകളും വായിച്ച് മനസ്സിലാക്കി അംഗീകരിച്ചതായി കണക്കാക്കുന്നതാണ്.\n15. ഈ കരാറിലെ ഏതെങ്കിലും നിബന്ധനകൾ ലംഘിക്കുന്നതിലൂടെ വാടകദാതാവിന് ഉണ്ടാകുന്ന യഥാർത്ഥ നഷ്ടം, കേടുപാട്, അധിക ചെലവ് എന്നിവയ്ക്ക്, ബാധകമായ നിയമങ്ങൾക്ക് വിധേയമായി Indian Contract Act, 1872-ലെ Section 73 പ്രകാരം നഷ്ടപരിഹാരം ആവശ്യപ്പെടാൻ വാടകദാതാവിന് അവകാശമുണ്ടായിരിക്കും.\n16. കരാർ ലംഘനം, ഉപകരണം തിരികെ നൽകാതിരിക്കൽ, ഉപകരണം നഷ്ടപ്പെടുത്തൽ തുടങ്ങിയ സാഹചര്യങ്ങളിൽ, ബാധകമായ നിയമപ്രകാരം ആവശ്യമായ നിയമനടപടികൾ സ്വീകരിക്കാൻ വാടകദാതാവിന് അവകാശമുണ്ടായിരിക്കും.'
  },
  rentalDefaultSecurityDeposit: { type: Number, default: 0 },
  rentalDefaultLateFee: { type: Number, default: 0 },
  showRentalTermsByDefault: { type: Boolean, default: true },

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
