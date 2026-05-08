const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  productName: {
    type: String,
    required: true
  },
  description: String,
  quantity: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  taxPercentage: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  }
});

const quotationSchema = new mongoose.Schema({
  programId: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
  quotationNumber: {
    type: String,
    required: true,
    unique: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  items: [itemSchema],
  subTotal: {
    type: Number,
    required: true
  },
  taxAmount: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  notes: String,
  terms: String,
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Rejected', 'Converted'],
    default: 'Pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Quotation', quotationSchema);
