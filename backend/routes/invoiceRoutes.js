const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer'); // Ensure registered
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, async (req, res) => {
  try {
    const filter = req.programId ? { programId: req.programId } : {};
    const invoices = await Invoice.find(filter).populate('customer', 'customerName').sort({ createdAt: -1 });
    res.json(invoices);
  } catch (error) {
    console.error('FETCH_INVOICES_ERROR:', error);
    res.status(500).json({ message: error.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    console.log('POST /invoices - BODY:', JSON.stringify(req.body, null, 2));
    if (!req.programId) return res.status(400).json({ message: 'No program selected' });

    // Get highest existing number for this program to prevent collisions after deletion
    const lastInvoice = await Invoice.findOne({ programId: req.programId }).sort({ createdAt: -1 });
    let nextNum = 1;
    if (lastInvoice && lastInvoice.invoiceNumber) {
      const parts = lastInvoice.invoiceNumber.split('-');
      const lastNum = parseInt(parts[parts.length - 1]);
      if (!isNaN(lastNum)) nextNum = lastNum + 1;
    }
    
    const programSuffix = req.programId.toString().slice(-4).toUpperCase();
    const invoiceNumber = `INV-${programSuffix}-${nextNum.toString().padStart(3, '0')}`;

    const { customer, items, subTotal, taxAmount, discount, totalAmount, notes, terms } = req.body;

    // Sanitize items: convert empty product strings to null to avoid CastError
    const sanitizedItems = items.map(item => ({
      ...item,
      product: (item.product && item.product !== '') ? item.product : null
    }));

    const invoice = new Invoice({
      programId: req.programId,
      invoiceNumber,
      customer,
      items: sanitizedItems,
      subTotal,
      taxAmount,
      discount: discount || 0,
      totalAmount,
      notes,
      terms
    });

    const createdInvoice = await invoice.save();
    res.status(201).json(createdInvoice);
  } catch (error) {
    console.error('CREATE_INVOICE_ERROR:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ message: `Invalid ID for field: ${error.path}` });
    }
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Invoice number collision. Please try again.' });
    }
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    console.log('PUT /invoices - BODY:', JSON.stringify(req.body, null, 2));
    const { customer, items, subTotal, taxAmount, discount, totalAmount, notes, terms, status } = req.body;
    
    // Sanitize items: convert empty product strings to null to avoid CastError
    const sanitizedItems = items.map(item => ({
      ...item,
      product: (item.product && item.product !== '') ? item.product : null
    }));

    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, programId: req.programId },
      { 
        customer, items: sanitizedItems, subTotal, taxAmount, discount, totalAmount, notes, terms, status
      },
      { new: true, runValidators: true }
    );
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.json(invoice);
  } catch (error) {
    console.error('UPDATE_INVOICE_ERROR:', error);
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

module.exports = router;
