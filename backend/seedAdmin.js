require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/estimation_app');
    
    // Check if admin exists
    const adminExists = await User.findOne({ email: 'admin@vyapar.com' });
    if (adminExists) {
      console.log('Admin already exists. Email: admin@vyapar.com | Password: admin123');
      process.exit();
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    await User.create({
      name: 'Super Admin',
      email: 'admin@vyapar.com',
      password: hashedPassword,
      role: 'admin'
    });

    console.log('Admin user created successfully! Email: admin@vyapar.com | Password: admin123');
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedAdmin();
