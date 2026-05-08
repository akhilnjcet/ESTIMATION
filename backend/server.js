require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
const { protect, restrictToView, verifyProgramAccess } = require('./middleware/authMiddleware');

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/programs', require('./routes/programRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));

// Secured Transactional Routes (Filtered by Program & Blocked for Viewers if Mutation)
app.use('/api/customers', protect, restrictToView, verifyProgramAccess, require('./routes/customerRoutes'));
app.use('/api/accounts', protect, restrictToView, verifyProgramAccess, require('./routes/accountRoutes'));
app.use('/api/transactions', protect, restrictToView, verifyProgramAccess, require('./routes/transactionRoutes'));
app.use('/api/products', protect, restrictToView, verifyProgramAccess, require('./routes/productRoutes'));
app.use('/api/quotations', protect, restrictToView, verifyProgramAccess, require('./routes/quotationRoutes'));
app.use('/api/invoices', protect, restrictToView, verifyProgramAccess, require('./routes/invoiceRoutes'));
app.use('/api/settings', protect, restrictToView, require('./routes/settingsRoutes'));
app.use('/api/notes', protect, restrictToView, verifyProgramAccess, require('./routes/noteRoutes'));

// Database connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/estimation_app';

// Global Error Logger (Must be after all routes)
app.use((err, req, res, next) => {
  console.error('--- GLOBAL SERVER ERROR ---');
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Internal Server Error' });
});

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Seed Admin Account
    const User = require('./models/User');
    const Program = require('./models/Program');
    const bcrypt = require('bcryptjs');

    const adminEmail = 'admin@krishna.com';
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      admin = await User.create({
        name: 'System Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin'
      });
      console.log('Admin account created');
    }

    // Seed Default Program
    const programExists = await Program.findOne({ owner: admin._id });
    if (!programExists) {
      await Program.create({
        name: 'Krishna Accounting',
        address: '123 Stadium Road',
        phone: '9999999999',
        email: 'admin@krishna.com',
        owner: admin._id
      });
      console.log('Default program created');
    }

    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });
