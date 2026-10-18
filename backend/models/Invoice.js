const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productName: { type: String, required: true },
  description: String,
  quantity: { type: Number, default: 1 },
  unit: { type: String, enum: ['Units', 'Kg'], default: 'Units' },
  price: { type: Number, default: 0, min: 0 },
  taxPercentage: { type: Number, default: 0 },
  total: { type: Number, default: 0, min: 0 },
  isCombinedMode: { type: Boolean, default: false },
  combinedSectionId: { type: String, default: null },
  isNewSectionStart: { type: Boolean, default: false }
});

const invoiceSchema = new mongoose.Schema({
  programId: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
  invoiceNumber: { type: String, required: true, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  combinedTotals: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  items: [itemSchema],
  subTotal: { type: Number, required: true, min: 0 },
  taxAmount: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  totalAmount: { type: Number, required: true, min: 0 },
  notes: String,
  terms: String,
  showTerms: { type: Boolean, default: true },
  showTax: { type: Boolean, default: false },
  showPaymentTerms: { type: Boolean, default: true },
  showSignature: { type: Boolean, default: true },
  showFooter: { type: Boolean, default: true },
  enableUnitPrice: { type: Boolean, default: true },
  enableQuantity: { type: Boolean, default: true },
  theme: { type: String, default: 'classic' },
  status: { type: String, default: 'Unpaid' },
  paymentStatus: { type: String, default: 'Unpaid' }
}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema);
