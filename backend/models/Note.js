const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  programId: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
  type: { 
    type: String, 
    enum: ['Income', 'Expense'], 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  date: { 
    type: Date, 
    default: Date.now 
  },
  editCount: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('Note', noteSchema);
