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
  mongoose.connect(MONGO_URI, { family: 4, serverSelectionTimeoutMS: 5000 })
    .then(async () => {
      console.log('Connected to MongoDB');
      // ... seeding logic (optional for local)
      app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch((err) => console.error('MongoDB connection error:', err));
}

// For production (Vercel)
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(MONGO_URI, { family: 4, serverSelectionTimeoutMS: 5000 });
  
  // Seed Admin & Program if they don't exist
  const User = require('./models/User');
  const Program = require('./models/Program');
  const bcrypt = require('bcryptjs');

  const adminEmail = 'admin@krishna.com';
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    admin = await User.create({
      name: 'System Admin', email: adminEmail, password: hashedPassword, role: 'admin'
    });
    console.log('Admin account created');
  }

  const programExists = await Program.findOne({ owner: admin._id });
  if (!programExists) {
    await Program.create({
      name: 'Krishna Accounting', owner: admin._id,
      address: '123 Stadium Road', phone: '9999999999', email: 'admin@krishna.com'
    });
    console.log('Default program created');
  }
};

// Middleware to ensure DB connection
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('SERVER_ERROR:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: err
  });
});

module.exports = app;
