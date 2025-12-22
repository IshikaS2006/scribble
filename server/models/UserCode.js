const mongoose = require('mongoose');

// UserCode collection - stores code for each user in each room
const userCodeSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  code: {
    type: String,
    default: ''
  },
  updatedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for efficient queries - one code per user per room
userCodeSchema.index({ roomId: 1, userId: 1 }, { unique: true });

// TTL index - automatically delete documents after 24 hours
userCodeSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model('UserCode', userCodeSchema);
