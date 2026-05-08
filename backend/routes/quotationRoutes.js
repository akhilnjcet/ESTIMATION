const express = require('express');
const router = express.Router();
const Quotation = require('../models/Quotation');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/quotations
// @desc    Get all quotations
router.get('/', protect, async (req, res) => {
  try {
    const query = req.programId ? { programId: req.programId } : {};
    const quotations = await Quotation.find(query).populate('customer', 'customerName').sort({ createdAt: -1 });
    res.json(quotations);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/quotations
// @desc    Create a quotation
router.post('/', protect, async (req, res) => {
  try {
    if (!req.programId) return res.status(400).json({ message: 'No program selected' });
    const { customer, items, subTotal, taxAmount, discount, totalAmount, notes, terms } = req.body;
    
    // Auto-generate unique quotation number per program
    const count = await Quotation.countDocuments({ programId: req.programId });
    // Use a unique suffix to avoid global collision across different programs
    const programSuffix = req.programId.toString().slice(-4).toUpperCase();
    const quotationNumber = `EST-${programSuffix}-${(count + 1).toString().padStart(3, '0')}`;

    const quotation = new Quotation({
      programId: req.programId,
      quotationNumber, customer, items, subTotal, taxAmount, discount, totalAmount, notes, terms
    });

    const createdQuotation = await quotation.save();
    res.status(201).json(createdQuotation);
  } catch (error) {
    console.error('QUOTATION_SAVE_ERROR:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation Error', details: error.message });
    }
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Quotation number already exists. Please try again.' });
    }
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
});

module.exports = router;
