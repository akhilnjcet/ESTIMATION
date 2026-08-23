const express = require('express');
const router = express.Router();
const RentalBill = require('../models/RentalBill');
const Program = require('../models/Program');
const Customer = require('../models/Customer'); 
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, async (req, res) => {
  try {
    const filter = req.programId ? { programId: req.programId } : {};
    const rentals = await RentalBill.find(filter).populate('customer', 'customerName').sort({ createdAt: -1 });
    res.json(rentals);
  } catch (error) {
    console.error('FETCH_RENTALS_ERROR:', error);
    res.status(500).json({ message: error.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    if (!req.programId) return res.status(400).json({ message: 'No program selected' });

    const { 
      customer, items, subTotal, taxAmount, discount, securityDeposit, advancePaid, 
      damageCharge, lateCharge, otherCharges, totalAmount, balanceAmount, 
      notes, terms, date, rentalStartDate, expectedReturnDate, actualReturnDate, status,
      conditionCheckout, conditionReturn,
      showTerms, showTax, showPaymentTerms, showSignature, showFooter, footerText, theme, 
      billNumber, customerSignature, receivedBy, returnedBy
    } = req.body;

    let finalBillNumber = billNumber;
    if (!finalBillNumber || finalBillNumber.trim() === '') {
      const program = await Program.findById(req.programId);
      const prefix = program?.rentalPrefix || 'RENT-';
      const lastBill = await RentalBill.findOne({ programId: req.programId }).sort({ createdAt: -1 });
      
      let nextNum = program?.rentalNextNumber || 1;
      if (lastBill && lastBill.billNumber) {
        // try to extract number
        const parts = lastBill.billNumber.split('-');
        const lastNum = parseInt(parts[parts.length - 1]);
        if (!isNaN(lastNum) && lastNum >= nextNum) {
          nextNum = lastNum + 1;
        }
      }
      finalBillNumber = `${prefix}${nextNum.toString().padStart(4, '0')}`;
      
      if (program) {
        program.rentalNextNumber = nextNum + 1;
        await program.save();
      }
    }

    const sanitizedItems = items.map(item => ({
      ...item,
      product: (item.product && item.product !== '') ? item.product : null
    }));

    const rentalBill = new RentalBill({
      programId: req.programId,
      billNumber: finalBillNumber,
      customer,
      items: sanitizedItems,
      subTotal,
      taxAmount,
      discount: discount || 0,
      securityDeposit: securityDeposit || 0,
      advancePaid: advancePaid || 0,
      damageCharge: damageCharge || 0,
      lateCharge: lateCharge || 0,
      otherCharges: otherCharges || 0,
      totalAmount,
      balanceAmount,
      notes,
      terms,
      date: date || new Date(),
      rentalStartDate,
      expectedReturnDate,
      actualReturnDate,
      status: status || 'Draft',
      conditionCheckout,
      conditionReturn,
      showTerms: showTerms !== undefined ? showTerms : true,
      showTax: showTax !== undefined ? showTax : true,
      showPaymentTerms: showPaymentTerms !== undefined ? showPaymentTerms : true,
      showSignature: showSignature !== undefined ? showSignature : true,
      showFooter: showFooter !== undefined ? showFooter : true,
      footerText: footerText !== undefined ? footerText : "",
      theme: theme || 'classic',
      customerSignature,
      receivedBy,
      returnedBy
    });

    const createdBill = await rentalBill.save();
    res.status(201).json(createdBill);
  } catch (error) {
    console.error('CREATE_RENTAL_ERROR:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Rental bill number collision. Please try again.' });
    }
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const { 
      customer, items, subTotal, taxAmount, discount, securityDeposit, advancePaid, 
      damageCharge, lateCharge, otherCharges, totalAmount, balanceAmount, 
      notes, terms, date, rentalStartDate, expectedReturnDate, actualReturnDate, status,
      conditionCheckout, conditionReturn,
      showTerms, showTax, showPaymentTerms, showSignature, showFooter, footerText, theme, 
      billNumber, customerSignature, receivedBy, returnedBy
    } = req.body;
    
    const sanitizedItems = items.map(item => ({
      ...item,
      product: (item.product && item.product !== '') ? item.product : null
    }));

    const updateData = { 
      customer,
      items: sanitizedItems,
      subTotal,
      taxAmount,
      discount,
      securityDeposit,
      advancePaid,
      damageCharge,
      lateCharge,
      otherCharges,
      totalAmount,
      balanceAmount,
      notes,
      terms,
      rentalStartDate,
      expectedReturnDate,
      actualReturnDate,
      status,
      conditionCheckout,
      conditionReturn,
      showTerms: showTerms !== undefined ? showTerms : true,
      showTax: showTax !== undefined ? showTax : true,
      showPaymentTerms: showPaymentTerms !== undefined ? showPaymentTerms : true,
      showSignature: showSignature !== undefined ? showSignature : true,
      showFooter: showFooter !== undefined ? showFooter : true,
      footerText: footerText !== undefined ? footerText : "",
      theme: theme || 'classic',
      customerSignature,
      receivedBy,
      returnedBy
    };
    
    if (billNumber && billNumber.trim() !== '') {
      updateData.billNumber = billNumber;
    }
    if (date) updateData.date = date;

    const rentalBill = await RentalBill.findOneAndUpdate(
      { _id: req.params.id, programId: req.programId },
      { $set: updateData },
      { new: true, runValidators: true }
    );
    if (!rentalBill) return res.status(404).json({ message: 'Rental bill not found' });
    res.json(rentalBill);
  } catch (error) {
    console.error('UPDATE_RENTAL_ERROR:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const rentalBill = await RentalBill.findOneAndDelete({ _id: req.params.id, programId: req.programId });
    if (!rentalBill) return res.status(404).json({ message: 'Rental bill not found' });
    res.json({ message: 'Rental bill deleted successfully' });
  } catch (error) {
    console.error('DELETE_RENTAL_ERROR:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
