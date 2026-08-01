const mongoose = require('mongoose');

const workItemSchema = new mongoose.Schema({
  workDescription: { type: String, required: true },
  labourCount: { type: Number, required: true, default: 1 },
  workingDays: { type: Number, required: true, default: 1 },
  rate: { type: Number, required: true, default: 0 },
  total: { type: Number, required: true, default: 0 }
});

const labourBillSchema = new mongoose.Schema({
  programId: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
  billNumber: { type: String, required: true, unique: true },
  billDate: { type: Date, required: true },
  
  // Service Provider / Contractor Details
  serviceProviderName: { type: String },
  serviceProviderAddress: { type: String },
  serviceProviderPhone: { type: String },
  serviceProviderGstin: { type: String },
  
  // Client / Consignee Details
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  clientName: { type: String },
  clientAddress: { type: String },
  clientPhone: { type: String },
  clientGstin: { type: String },
  
  // Transport & Logistics Details
  vehicleNumber: { type: String },
  lrGrNumber: { type: String },
  origin: { type: String },
  destination: { type: String },
  goodsDescription: { type: String },
  loadingDate: { type: Date },
  unloadingDate: { type: Date },
  numberOfLabourers: { type: Number },
  
  // Dynamic Work Items (New table of work)
  workItems: [workItemSchema],

  // Extra Charges
  loadingCharges: { type: Number, default: 0 },
  unloadingCharges: { type: Number, default: 0 },
  handlingCharges: { type: Number, default: 0 },
  packingCharges: { type: Number, default: 0 },
  overtimeCharges: { type: Number, default: 0 },
  additionalCharges: { type: Number, default: 0 },
  
  // Tax Details
  taxPercentage: { type: Number, default: 0 },
  taxDetails: { type: String }, // e.g. "GST 18%", "CGST 9% + SGST 9%", etc.
  
  // Calculation Totals
  subTotal: { type: Number, required: true, default: 0 },
  taxAmount: { type: Number, required: true, default: 0 },
  totalAmount: { type: Number, required: true, default: 0 },
  amountInWords: { type: String },
  
  // Extra fields & Print Toggles
  paymentTerms: { type: String },
  remarks: { type: String },
  status: { type: String, default: 'Unpaid' },
  paymentStatus: { type: String, default: 'Unpaid' },
  
  // Print Toggles
  showTerms: { type: Boolean, default: true },
  showTax: { type: Boolean, default: true },
  showSignature: { type: Boolean, default: true },
  showPaymentTerms: { type: Boolean, default: true },
  showFooter: { type: Boolean, default: true },
  footerText: { type: String, default: "Generated electronically. Subject to jurisdiction terms.\nThank you for your business! | Powered by Krishna ERP" }
}, { timestamps: true });

labourBillSchema.index({ programId: 1 });

module.exports = mongoose.model('LabourBill', labourBillSchema);
