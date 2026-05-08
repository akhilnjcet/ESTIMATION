const express = require('express');
const router = express.Router();
const Quotation = require('../models/Quotation');
const Customer = require('../models/Customer'); // Ensure registered
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/quotations
// @desc    Get all quotations
router.get('/', protect, async (req, res) => {
  try {
    const query = req.programId ? { programId: req.programId } : {};
    const quotations = await Quotation.find(query).populate('customer', 'customerName').sort({ createdAt: -1 });
    res.json(quotations);
  } catch (error) {
    console.error('FETCH_QUOTATIONS_ERROR:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// @route   POST /api/quotations
// @desc    Create a quotation
router.post('/', protect, async (req, res) => {
  try {
    console.log('POST /quotations - BODY:', JSON.stringify(req.body, null, 2));
    if (!req.programId) return res.status(400).json({ message: 'No program selected' });
    const { customer, items, subTotal, taxAmount, discount, totalAmount, notes, terms } = req.body;
    
    // Get highest existing number for this program to prevent collisions after deletion
    const lastQuotation = await Quotation.findOne({ programId: req.programId }).sort({ createdAt: -1 });
    let nextNum = 1;
    if (lastQuotation && lastQuotation.quotationNumber) {
      const parts = lastQuotation.quotationNumber.split('-');
      const lastNum = parseInt(parts[parts.length - 1]);
      if (!isNaN(lastNum)) nextNum = lastNum + 1;
    }

    const programSuffix = req.programId.toString().slice(-4).toUpperCase();
    const quotationNumber = `EST-${programSuffix}-${nextNum.toString().padStart(3, '0')}`;

    // Sanitize items: convert empty product strings to null to avoid CastError
    const sanitizedItems = items.map(item => ({
      ...item,
      product: (item.product && item.product !== '') ? item.product : null
    }));

    const quotation = new Quotation({
      programId: req.programId,
      quotationNumber,
      customer,
      items: sanitizedItems,
      subTotal,
      taxAmount,
      discount: discount || 0,
      totalAmount,
      notes,
      terms
    });

    const createdQuotation = await quotation.save();
    res.status(201).json(createdQuotation);
  } catch (error) {
    console.error('CREATE_QUOTATION_ERROR:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ message: `Invalid ID for field: ${error.path}` });
    }
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Quotation number collision. Please try again.' });
    }
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    console.log('PUT /quotations - BODY:', JSON.stringify(req.body, null, 2));
    const { customer, items, subTotal, taxAmount, discount, totalAmount, notes, terms, status } = req.body;

    // Sanitize items: convert empty product strings to null to avoid CastError
    const sanitizedItems = items.map(item => ({
      ...item,
      product: (item.product && item.product !== '') ? item.product : null
    }));

    const quotation = await Quotation.findOneAndUpdate(
      { _id: req.params.id, programId: req.programId },
      { 
        customer, items: sanitizedItems, subTotal, taxAmount, discount, totalAmount, notes, terms, status
      },
      { new: true, runValidators: true }
    );

    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found' });
    }

    res.json(quotation);
  } catch (error) {
    console.error('UPDATE_QUOTATION_ERROR:', error);
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

module.exports = router;
