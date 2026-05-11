const express = require('express');
const router = express.Router();
const Document = require('../models/Document');
const { protect } = require('../middleware/authMiddleware');

// Get all documents for the selected program
router.get('/', protect, async (req, res) => {
  try {
    if (!req.programId) return res.status(400).json({ message: 'No program selected' });
    const documents = await Document.find({ programId: req.programId }).sort({ date: -1, createdAt: -1 });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Upload new document
router.post('/', protect, async (req, res) => {
  try {
    if (!req.programId) return res.status(400).json({ message: 'No program selected' });
    const { title, fileName, fileUrl, fileType, date, description, amount } = req.body;
    
    const document = await Document.create({
      title, fileName, fileUrl, fileType, date, description, amount,
      programId: req.programId
    });
    
    res.status(201).json(document);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete document
router.delete('/:id', protect, async (req, res) => {
  try {
    const doc = await Document.findOneAndDelete({ _id: req.params.id, programId: req.programId });
    if (!doc) return res.status(404).json({ message: 'Document not found' });
    res.json({ message: 'Document deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
