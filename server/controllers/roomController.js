const { v4: uuidv4 } = require('uuid');
const roomStore = require('../utils/roomStore');
const { generateAdminKey } = require('../utils/helpers');

/**
 * Create a new room
 * @route POST /rooms
 */
const createRoom = (req, res) => {
  try {
    const roomId = uuidv4();
    const adminKey = generateAdminKey();
    
    roomStore.createRoom(roomId, adminKey);
    
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
