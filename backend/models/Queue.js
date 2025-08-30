const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();

// Protect all routes
router.use(auth);

// Get all queues
router.get('/', async (req, res) => {
  try {
    res.json([{ message: 'Queues endpoint working' }]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Other queue routes would go here...

module.exports = router;const mongoose = require('mongoose');

const queueSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
queueSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Queue', queueSchema);