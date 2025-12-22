const { v4: uuidv4 } = require('uuid');
const roomStore = require('../utils/roomStore');
const { generateAdminKey } = require('../utils/helpers');
const Room = require('../models/Room');

/**
 * Create a new room
 * @route POST /rooms
 */
const createRoom = async (req, res) => {
  try {
    const roomId = uuidv4();
    const adminKey = generateAdminKey();
    
    // Create in memory
    roomStore.createRoom(roomId, adminKey);
    
    // ✅ STEP 8: Save to MongoDB
    try {
      await Room.create({
        roomId,
        adminKey,
        publicStrokes: []
      });
      console.log(`💾 Room saved to DB: ${roomId}`);
    } catch (dbError) {
      console.log('⚠️ DB save failed, using in-memory only');
    }
    
    console.log(`🏠 Room created: ${roomId}`);
    console.log(`🔑 Admin key: ${adminKey}`);
    
    res.status(201).json({ roomId, adminKey });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
};

/**
 * Get server health status
 * @route GET /
 */
const getHealthStatus = (req, res) => {
  const rooms = roomStore.getAllRooms();
  const totalUsers = roomStore.getTotalUsers();
  
  res.json({
    status: 'Server is running',
    rooms: Object.keys(rooms).length,
    totalUsers,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  createRoom,
  getHealthStatus
};
