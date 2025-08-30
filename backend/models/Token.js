const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  number: {
    type: Number,
    required: true
  },
  customerName: {
    type: String,
    trim: true,
    maxlength: 100
  },
  queue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Queue',
    required: true
  },
  status: {
    type: String,
    enum: ['waiting', 'serving', 'completed', 'cancelled'],
    default: 'waiting'
  },
  position: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  calledAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  waitTime: {
    type: Number, // in minutes
    default: 0
  }
});

// Calculate wait time when token is completed
tokenSchema.pre('save', function(next) {
  if (this.status === 'completed' && this.calledAt && !this.completedAt) {
    this.completedAt = new Date();
    this.waitTime = Math.round((this.completedAt - this.calledAt) / 1000 / 60); // minutes
  }
  next();
});

module.exports = mongoose.model('Token', tokenSchema);