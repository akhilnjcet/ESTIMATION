const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  businessName: { type: String, default: 'My Business' },
  address: { type: String, default: '123 Main St, City, Country' },
  phone: { type: String, default: '+91 9876543210' },
  email: { type: String, default: 'contact@mybusiness.com' },
  gstNumber: { type: String, default: '' },
  website: { type: String, default: '' },
});

module.exports = mongoose.model('BusinessSettings', settingsSchema);
