const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productName: { type: String, required: true },
  description: String,
  quantity: { type: Number, required: true },
  unit: { type: String, enum: ['Units', 'Kg'], default: 'Units' },
  price: { type: Number, required: true, min: 0 },
  taxPercentage: { type: Number, default: 0 },
  total: { type: Number, required: true, min: 0 },
  isCombinedMode: { type: Boolean, default: false }
});

const invoiceSchema = new mongoose.Schema({
  programId: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
  invoiceNumber: { type: String, required: true, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  combinedTotal: { type: Number, default: 0, min: 0 },
  items: [itemSchema],
  subTotal: { type: Number, required: true, min: 0 },
  taxAmount: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  totalAmount: { type: Number, required: true, min: 0 },
  notes: String,
  terms: String,
  showTerms: { type: Boolean, default: true },
  showTax: { type: Boolean, default: true },
  showPaymentTerms: { type: Boolean, default: true },
  showSignature: { type: Boolean, default: true },
  showFooter: { type: Boolean, default: true },
  theme: { type: String, default: 'classic' },
  status: { type: String, default: 'Unpaid' },
  paymentStatus: { type: String, default: 'Unpaid' }
}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema);
