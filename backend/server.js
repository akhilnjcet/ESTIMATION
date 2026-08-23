require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Health Check for Debugging
app.get('/api/health', async (req, res) => {
  let connectionError = null;
  try {
    if (mongoose.connection.readyState !== 1 && process.env.MONGO_URI) {
      await mongoose.connect(process.env.MONGO_URI, { family: 4, serverSelectionTimeoutMS: 5000 });
    }
  } catch (err) {
    connectionError = err.message;
  }

  res.json({ 
    status: 'OK', 
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    error: connectionError,
    mongo_uri_exists: !!process.env.MONGO_URI,
    node_version: process.version
  });
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Middleware to ensure DB connection
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

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
app.use('/api/labour-bills', protect, restrictToView, verifyProgramAccess, require('./routes/labourBillRoutes'));
app.use('/api/settings', protect, restrictToView, require('./routes/settingsRoutes'));
app.use('/api/notes', protect, restrictToView, verifyProgramAccess, require('./routes/noteRoutes'));
app.use('/api/documents', protect, restrictToView, verifyProgramAccess, require('./routes/documentRoutes'));
app.use('/api/rentals', protect, restrictToView, verifyProgramAccess, require('./routes/rentalRoutes'));
app.use('/api/staff', protect, restrictToView, verifyProgramAccess, require('./routes/staffRoutes'));



// Database connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('--- CRITICAL ERROR: MONGO_URI NOT FOUND ---');
}

// Global Error Logger (Must be after all routes)
app.use((err, req, res, next) => {
  console.error('--- GLOBAL SERVER ERROR ---');
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Internal Server Error' });
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  const startServer = async () => {
    try {
      await mongoose.connect(MONGO_URI, { family: 4, serverSelectionTimeoutMS: 5000 });
      console.log('Connected to Primary MongoDB Atlas');
      await seedDefaultData();
    } catch (err) {
      console.warn('Primary MongoDB Atlas connection failed:', err.message);
      try {
        const localUri = 'mongodb://127.0.0.1:27017/estimation_app';
        await mongoose.connect(localUri, { serverSelectionTimeoutMS: 3000 });
        console.log('Connected to Local MongoDB fallback');
        await seedDefaultData();
      } catch (localErr) {
        console.error('Local MongoDB fallback also failed. Running server without active DB connection:', localErr.message);
      }
    }
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  };
  startServer();
}

// For production (Vercel)
const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return;
  
  // If already connecting, wait for it to finish
  if (mongoose.connection.readyState === 2) {
    await new Promise(resolve => {
      const interval = setInterval(() => {
        if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 0) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
    });
    return;
  }

  if (!MONGO_URI) {
    console.error('MONGO_URI missing in environment');
    return;
  }

  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 8000 });
    await seedDefaultData();
  } catch (err) {
    console.error('Production DB connection error:', err.message);
  }
};

const seedDefaultData = async () => {
  try {
    const User = require('./models/User');
    const Program = require('./models/Program');
    const Customer = require('./models/Customer');
    const Invoice = require('./models/Invoice');
    const LabourBill = require('./models/LabourBill');
    const Account = require('./models/Account');
    const Transaction = require('./models/Transaction');
    const bcrypt = require('bcryptjs');

    const adminEmail = 'admin@krishna.com';
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      admin = await User.create({
        name: 'System Admin', email: adminEmail, password: hashedPassword, role: 'admin'
      });
      console.log('Admin account created: admin@krishna.com');
    }

    let program = await Program.findOne({ owner: admin._id });
    if (!program) {
      program = await Program.create({
        name: 'Krishna Smart Solutions', owner: admin._id,
        address: '123 Stadium Road', phone: '9999999999', email: 'admin@krishna.com'
      });
      console.log('Default program created');
    }

    let customer = await Customer.findOne({ programId: program._id });
    if (!customer) {
      customer = await Customer.create({
        programId: program._id,
        customerName: 'General Client',
        phone: '9876543210',
        address: 'Main Market, City Center'
      });
    }

    const invoiceCount = await Invoice.countDocuments({ programId: program._id });
    if (invoiceCount === 0) {
      await Invoice.create({
        programId: program._id,
        invoiceNumber: 'INV-2026-0001',
        customer: customer._id,
        items: [{ productName: 'Enterprise ERP Setup & Service', quantity: 1, unit: 'Units', price: 45000, total: 45000 }],
        subTotal: 45000,
        taxAmount: 0,
        totalAmount: 45000,
        status: 'Paid'
      });
    }

    const billCount = await LabourBill.countDocuments({ programId: program._id });
    if (billCount === 0) {
      await LabourBill.create({
        programId: program._id,
        billNumber: 'LRB-2026-0001',
        customer: customer._id,
        clientName: 'General Client',
        supervisorName: 'Supervisor Raj',
        workLocation: 'Site Work',
        workItems: [{ workDescription: 'Daily Wage Skilled Labour', labourCount: 5, workingDays: 4, rate: 700, total: 14000 }],
        subTotal: 14000,
        totalAmount: 14000,
        status: 'Paid'
      });
    }

    const accountCount = await Account.countDocuments({ programId: program._id });
    if (accountCount === 0) {
      const cashAcc = await Account.create({ programId: program._id, name: 'Main Cash Box', type: 'Cash', balance: 25500, openingBalance: 25500 });
      const bankAcc = await Account.create({ programId: program._id, name: 'HDFC Bank Account', type: 'Bank', balance: 48000, openingBalance: 48000 });

      const txCount = await Transaction.countDocuments({ programId: program._id });
      if (txCount === 0) {
        await Transaction.create({
          programId: program._id,
          type: 'Income',
          amount: 45000,
          account: bankAcc._id,
          category: 'Sales Invoice Payment',
          description: 'Payment received for INV-2026-0001',
          date: new Date()
        });
        await Transaction.create({
          programId: program._id,
          type: 'Expense',
          amount: 14000,
          account: cashAcc._id,
          category: 'Labour Wages Expense',
          description: 'Payout for LRB-2026-0001',
          date: new Date()
        });
      }
    }
  } catch (err) {
    console.error('Seeding error:', err.message);
  }
};

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('SERVER_ERROR:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: err.message
  });
});

module.exports = app;
