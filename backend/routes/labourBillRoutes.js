const express = require('express');
const router = express.Router();
const LabourBill = require('../models/LabourBill');
const Customer = require('../models/Customer');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/labour-bills
// @desc    Get all labour bills for the active program
router.get('/', protect, async (req, res) => {
  try {
    if (!req.programId) return res.status(400).json({ message: 'No program selected' });
    const filter = { programId: req.programId };
    const bills = await LabourBill.find(filter)
      .populate('customer', 'customerName phone address gstNumber')
      .sort({ createdAt: -1 });
    res.json(bills);
  } catch (error) {
    console.error('FETCH_LABOUR_BILLS_ERROR:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// @route   POST /api/labour-bills
// @desc    Create a new labour bill
router.post('/', protect, async (req, res) => {
  try {
    if (!req.programId) return res.status(400).json({ message: 'No program selected' });

    const {
      billNumber,
      billDate,
      serviceProviderName,
      serviceProviderAddress,
      serviceProviderPhone,
      serviceProviderGstin,
      customer,
      clientName,
      clientAddress,
      clientPhone,
      clientGstin,
      vehicleNumber,
      lrGrNumber,
      origin,
      destination,
      goodsDescription,
      loadingDate,
      unloadingDate,
      numberOfLabourers,
      labourCharges,
      loadingCharges,
      unloadingCharges,
      handlingCharges,
      packingCharges,
      overtimeCharges,
      additionalCharges,
      taxPercentage,
      taxDetails,
      subTotal,
      taxAmount,
      totalAmount,
      amountInWords,
      paymentTerms,
      remarks,
      theme,
      status
    } = req.body;

    let finalBillNumber = billNumber;
    if (!finalBillNumber || finalBillNumber.trim() === '') {
      // Find the last generated bill for this program and increment it
      const lastBill = await LabourBill.findOne({ programId: req.programId }).sort({ createdAt: -1, billNumber: -1 });
      let nextNum = 1;
      if (lastBill && lastBill.billNumber) {
        const parts = lastBill.billNumber.split('-');
        const lastNum = parseInt(parts[parts.length - 1]);
        if (!isNaN(lastNum)) nextNum = lastNum + 1;
      }
      const programSuffix = req.programId.toString().slice(-4).toUpperCase();
      finalBillNumber = `LRB-${programSuffix}-${nextNum.toString().padStart(4, '0')}`;
    }

    const bill = new LabourBill({
      programId: req.programId,
      billNumber: finalBillNumber,
      billDate: billDate || new Date(),
      serviceProviderName,
      serviceProviderAddress,
      serviceProviderPhone,
      serviceProviderGstin,
      customer: customer || null,
      clientName,
      clientAddress,
      clientPhone,
      clientGstin,
      vehicleNumber,
      lrGrNumber,
      origin,
      destination,
      goodsDescription,
      loadingDate,
      unloadingDate,
      numberOfLabourers: numberOfLabourers || null,
      labourCharges: labourCharges || 0,
      loadingCharges: loadingCharges || 0,
      unloadingCharges: unloadingCharges || 0,
      handlingCharges: handlingCharges || 0,
      packingCharges: packingCharges || 0,
      overtimeCharges: overtimeCharges || 0,
      additionalCharges: additionalCharges || 0,
      taxPercentage: taxPercentage || 0,
      taxDetails,
      subTotal,
      taxAmount,
      totalAmount,
      amountInWords,
      paymentTerms,
      remarks,
      theme: theme || 'classic',
      status: status || 'Unpaid'
    });

    const createdBill = await bill.save();
    res.status(201).json(createdBill);
  } catch (error) {
    console.error('CREATE_LABOUR_BILL_ERROR:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Bill number collision. Please try again.' });
    }
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// @route   PUT /api/labour-bills/:id
// @desc    Update a labour bill
router.put('/:id', protect, async (req, res) => {
  try {
    const {
      billNumber,
      billDate,
      serviceProviderName,
      serviceProviderAddress,
      serviceProviderPhone,
      serviceProviderGstin,
      customer,
      clientName,
      clientAddress,
      clientPhone,
      clientGstin,
      vehicleNumber,
      lrGrNumber,
      origin,
      destination,
      goodsDescription,
      loadingDate,
      unloadingDate,
      numberOfLabourers,
      labourCharges,
      loadingCharges,
      unloadingCharges,
      handlingCharges,
      packingCharges,
      overtimeCharges,
      additionalCharges,
      taxPercentage,
      taxDetails,
      subTotal,
      taxAmount,
      totalAmount,
      amountInWords,
      paymentTerms,
      remarks,
      theme,
      status
    } = req.body;

    const updateData = {
      billDate,
      serviceProviderName,
      serviceProviderAddress,
      serviceProviderPhone,
      serviceProviderGstin,
      customer: customer || null,
      clientName,
      clientAddress,
      clientPhone,
      clientGstin,
      vehicleNumber,
      lrGrNumber,
      origin,
      destination,
      goodsDescription,
      loadingDate,
      unloadingDate,
      numberOfLabourers: numberOfLabourers || null,
      labourCharges: labourCharges || 0,
      loadingCharges: loadingCharges || 0,
      unloadingCharges: unloadingCharges || 0,
      handlingCharges: handlingCharges || 0,
      packingCharges: packingCharges || 0,
      overtimeCharges: overtimeCharges || 0,
      additionalCharges: additionalCharges || 0,
      taxPercentage: taxPercentage || 0,
      taxDetails,
      subTotal,
      taxAmount,
      totalAmount,
      amountInWords,
      paymentTerms,
      remarks,
      theme,
      status
    };

    if (billNumber && billNumber.trim() !== '') {
      updateData.billNumber = billNumber;
    }

    const updatedBill = await LabourBill.findOneAndUpdate(
      { _id: req.params.id, programId: req.programId },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedBill) return res.status(404).json({ message: 'Labour Bill not found' });
    res.json(updatedBill);
  } catch (error) {
    console.error('UPDATE_LABOUR_BILL_ERROR:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// @route   DELETE /api/labour-bills/:id
// @desc    Delete a labour bill
router.delete('/:id', protect, async (req, res) => {
  try {
    const deletedBill = await LabourBill.findOneAndDelete({
      _id: req.params.id,
      programId: req.programId
    });

    if (!deletedBill) return res.status(404).json({ message: 'Labour Bill not found' });
    res.json({ message: 'Labour Bill deleted successfully' });
  } catch (error) {
    console.error('DELETE_LABOUR_BILL_ERROR:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
