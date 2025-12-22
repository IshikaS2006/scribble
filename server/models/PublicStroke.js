const mongoose = require('mongoose');

// ✅ TASK 1: PublicStroke collection - separate from Room
const publicStrokeSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    index: true
  },
  strokeId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  authorId: {
    type: String,
    required: true
  },
  points: {
    type: [{
      x: { type: Number, required: true },
      y: { type: Number, required: true }
    }],
    required: true
  },
  color: {
    type: String,
    required: true
  },
  width: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Compound index for efficient queries
publicStrokeSchema.index({ roomId: 1, createdAt: 1 });

module.exports = mongoose.model('PublicStroke', publicStrokeSchema);
