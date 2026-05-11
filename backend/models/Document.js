const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  programId: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
  title: { type: String, required: true },
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileType: { type: String, enum: ['PDF', 'Image'], required: true },
  date: { type: Date, default: Date.now },
  description: String,
  amount: Number,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Document', documentSchema);
