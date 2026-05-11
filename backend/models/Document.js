const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  programId: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
  title: { type: String, required: true },
  fileName: { type: String }, // Optional if link
  fileUrl: { type: String },  // Optional if link
  externalLink: { type: String }, // For Drive/Web links
  fileType: { type: String, enum: ['PDF', 'Image', 'Link'], required: true },
  date: { type: Date, default: Date.now },
  description: String,
  amount: Number,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Document', documentSchema);
