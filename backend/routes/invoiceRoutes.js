const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, async (req, res) => {
  try {
    const filter = req.programId ? { programId: req.programId } : {};
    const invoices = await Invoice.find(filter).populate('customer', 'customerName').sort({ createdAt: -1 });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    if (!req.programId) return res.status(400).json({ message: 'No program selected' });
    const { customer, items, subTotal, taxAmount, discount, totalAmount, notes, terms } = req.body;
    
    const count = await Invoice.countDocuments({ programId: req.programId });
    const programSuffix = req.programId.toString().slice(-4).toUpperCase();
    const invoiceNumber = `INV-${programSuffix}-${(count + 1).toString().padStart(3, '0')}`;

    const invoice = new Invoice({
      programId: req.programId,
      invoiceNumber, customer, items, subTotal, taxAmount, discount, totalAmount, notes, terms
    });

    const created = await invoice.save();
    res.status(201).json(created);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
