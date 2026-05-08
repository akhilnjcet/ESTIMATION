const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/customers
// @desc    Get all customers
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const query = req.programId ? { programId: req.programId } : {};
    const customers = await Customer.find(query).sort({ createdAt: -1 });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/customers
// @desc    Create a customer
// @access  Private
router.post('/', protect, async (req, res) => {
  const { customerName, phone, email, address, gstNumber } = req.body;

  try {
    if (!req.programId) return res.status(400).json({ message: 'No program selected' });
    const customer = new Customer({
      programId: req.programId,
      customerName,
      phone,
      email,
      address,
      gstNumber,
    });

    const createdCustomer = await customer.save();
    res.status(201).json(createdCustomer);
  } catch (error) {
    console.error('ERROR SAVING CUSTOMER:', error);
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/customers/:id
// @desc    Update a customer
// @access  Private
router.put('/:id', protect, async (req, res) => {
  const { customerName, phone, email, address, gstNumber } = req.body;

  try {
    const customer = await Customer.findById(req.params.id);

    if (customer) {
      customer.customerName = customerName || customer.customerName;
      customer.phone = phone || customer.phone;
      customer.email = email || customer.email;
      customer.address = address || customer.address;
      customer.gstNumber = gstNumber || customer.gstNumber;

      const updatedCustomer = await customer.save();
      res.json(updatedCustomer);
    } else {
      res.status(404).json({ message: 'Customer not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/customers/:id
// @desc    Delete a customer
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (customer) {
      await customer.deleteOne();
      res.json({ message: 'Customer removed' });
    } else {
      res.status(404).json({ message: 'Customer not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
