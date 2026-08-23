const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productName: { type: String, required: true },
  description: String,
  quantity: { type: Number, required: true },
  unit: { type: String, enum: ['Units', 'Kg'], default: 'Units' },
  price: { type: Number, required: true, min: 0 },
  rateType: { type: String, enum: ['Hour', 'Day', 'Week', 'Month', 'Fixed'], default: 'Day' },
  rentalDuration: { type: Number, default: 1 },
  taxPercentage: { type: Number, default: 0 },
  total: { type: Number, required: true, min: 0 },
  lateFeePerDay: { type: Number, default: 0 },
  itemNos: { type: String },
  condition: { type: String },
  isReturned: { type: Boolean, default: false },
  returnCondition: { type: String },
  itemLateCharge: { type: Number, default: 0 }
});

const rentalBillSchema = new mongoose.Schema({
  programId: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
  billNumber: { type: String, required: true, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  items: [itemSchema],
  
  // Rental dates
  date: { type: Date, default: Date.now },
  rentalStartDate: { type: Date },
  expectedReturnDate: { type: Date },
  actualReturnDate: { type: Date },

  // Totals & Charges
  subTotal: { type: Number, required: true, min: 0 },
  taxAmount: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  securityDeposit: { type: Number, default: 0, min: 0 },
  advancePaid: { type: Number, default: 0, min: 0 },
  damageCharge: { type: Number, default: 0, min: 0 },
  lossCharge: { type: Number, default: 0, min: 0 },
  lateCharge: { type: Number, default: 0, min: 0 },
  otherCharges: { type: Number, default: 0, min: 0 },
  totalAmount: { type: Number, required: true, min: 0 }, // subTotal - discount + taxAmount + damageCharge + lossCharge + lateCharge + otherCharges
  balanceAmount: { type: Number, required: true, min: 0 }, // totalAmount - advancePaid
  
  // Status & Conditions
  status: { type: String, enum: ['Draft', 'Active', 'Partially Returned', 'Returned', 'Overdue', 'Cancelled'], default: 'Draft' },
  conditionCheckout: { type: String },
  conditionReturn: { type: String },
  
  notes: String,
  terms: String,

  // Display Settings
  showTerms: { type: Boolean, default: true },
  showTax: { type: Boolean, default: true },
  showPaymentTerms: { type: Boolean, default: true },
  showSignature: { type: Boolean, default: true },
  showFooter: { type: Boolean, default: true },
  footerText: String,
  theme: { type: String, default: 'classic' },
  
  // Signatures
  customerSignature: { type: String },
  receivedBy: { type: String },
  returnedBy: { type: String }

}, { timestamps: true });

module.exports = mongoose.model('RentalBill', rentalBillSchema);
