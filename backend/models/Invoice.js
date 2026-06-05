const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productName: { type: String, required: true },
  description: String,
  quantity: { type: Number, required: true },
  unit: { type: String, enum: ['Units', 'Kg'], default: 'Units' },
  price: { type: Number, required: true, min: 0 },
  taxPercentage: { type: Number, default: 0 },
  total: { type: Number, required: true, min: 0 }
});

const invoiceSchema = new mongoose.Schema({
  programId: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
  invoiceNumber: { type: String, required: true, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
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
  theme: { type: String, enum: ['classic', 'modern', 'minimalist'], default: 'classic' },
  status: { type: String, enum: ['Unpaid', 'Paid', 'Overdue'], default: 'Unpaid' }
}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema);
