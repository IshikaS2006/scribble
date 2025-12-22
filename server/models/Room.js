const mongoose = require('mongoose');

// ✅ TASK 1: Room collection - only room metadata
const roomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  adminKey: {
    type: String,
    required: true
  },
  adminId: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 86400000), // 24 hours from now
    expires: 0 // TTL index: delete when expiresAt is reached
  }
});

module.exports = mongoose.model('Room', roomSchema);
