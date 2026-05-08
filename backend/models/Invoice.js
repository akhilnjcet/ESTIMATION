const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productName: { type: String, required: true },
  description: String,
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  taxPercentage: { type: Number, default: 0 },
  total: { type: Number, required: true }
});

const invoiceSchema = new mongoose.Schema({
  programId: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
  invoiceNumber: { type: String, required: true, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  items: [itemSchema],
  subTotal: { type: Number, required: true },
  taxAmount: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  notes: String,
  terms: String,
  status: { type: String, enum: ['Unpaid', 'Paid', 'Overdue'], default: 'Unpaid' }
}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema);
