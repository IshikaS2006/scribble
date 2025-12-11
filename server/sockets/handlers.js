const { v4: uuidv4 } = require('uuid');
const roomStore = require('../utils/roomStore');

/**
 * Handle user joining a room
 */
const handleJoinRoom = (io, socket, { roomId, userId, adminKey }) => {
  console.log(`👤 joinRoom request - Room: ${roomId}, User: ${userId}, AdminKey: ${adminKey ? '***' : 'none'}`);
  
  if (!roomId || !userId) {
    socket.emit('error', { message: 'roomId and userId are required' });
    return;
  }
  
  // Create room if it doesn't exist (for backward compatibility)
  if (!roomStore.roomExists(roomId)) {
    roomStore.createRoom(roomId, null);
    console.log(`🏠 Auto-created room: ${roomId}`);
  }
  
  const room = roomStore.getRoom(roomId);
  
  // Check admin status
  socket.data.userId = userId;
  socket.data.roomId = roomId;
  socket.data.isAdmin = false;
  
  // Verify adminKey if provided
  if (adminKey && roomStore.verifyAdminKey(roomId, adminKey)) {
    socket.data.isAdmin = true;
    if (!room.adminId) {
      roomStore.setAdmin(roomId, userId);
      console.log(`👑 Admin set for room ${roomId}: ${userId}`);
    }
  }
  
  // Add userId -> socketId mapping
  roomStore.addUserSocket(roomId, userId, socket.id);
  
  // Join socket.io room
  socket.join(roomId);
  
  console.log(`✅ User ${userId} joined room ${roomId} (Admin: ${socket.data.isAdmin})`);
  console.log(`📊 Room ${roomId} now has ${roomStore.getUserCount(roomId)} users`);
  
  // Send room state to the joining user
  socket.emit('room-joined', {
    roomId,
    userId,
    isAdmin: socket.data.isAdmin,
    publicStrokes: room.publicStrokes,
    userCount: roomStore.getUserCount(roomId)
  });
  
  // Notify room of user count update
  io.to(roomId).emit('users-update', { 
    count: roomStore.getUserCount(roomId)
  });
};

/**
 * Handle public stroke
 */
const handlePublicStroke = (io, socket, stroke) => {
  const { roomId, userId } = socket.data;
  
  if (!roomId || !userId) {
    console.log('⚠️ public-stroke: No room/user data');
    return;
  }
  
  if (!roomStore.roomExists(roomId)) {
    console.log(`⚠️ public-stroke: Room ${roomId} not found`);
    return;
  }
  
  const strokeData = {
    id: stroke.id || uuidv4(),
    from: userId,
    stroke,
    createdAt: Date.now()
  };
  
  roomStore.addPublicStroke(roomId, strokeData);
  console.log(`📤 public-stroke from ${userId} in room ${roomId}`);
  
  // Broadcast to all in room except sender
  socket.to(roomId).emit('public-stroke', strokeData);
};

/**
 * Handle private stroke (send to all user's sockets)
 */
const handlePrivateStroke = (io, socket, stroke) => {
  const { roomId, userId } = socket.data;
  
  if (!roomId || !userId) {
    console.log('⚠️ private-stroke: No room/user data');
    return;
  }
  
  if (!roomStore.roomExists(roomId)) {
    console.log(`⚠️ private-stroke: Room ${roomId} not found`);
    return;
  }
  
  roomStore.addPrivateStroke(roomId, userId, stroke);
  console.log(`🔒 private-stroke from ${userId} in room ${roomId}`);
  
  // Send to all sockets of this user (multi-tab support)
  const userSockets = roomStore.getUserSockets(roomId, userId);
  userSockets.forEach(socketId => {
    if (socketId !== socket.id) {
      io.to(socketId).emit('private-stroke', stroke);
    }
  });
};

/**
 * Handle promote stroke (private -> public)
 */
const handlePromoteStroke = (io, socket, { strokeIds }) => {
  const { roomId, userId } = socket.data;
  
  if (!roomId || !userId) {
    console.log('⚠️ promote-stroke: No room/user data');
    return;
  }
  
  if (!roomStore.roomExists(roomId)) {
    console.log(`⚠️ promote-stroke: Room/strokes not found`);
    return;
  }
  
  console.log(`📢 promote-stroke: ${strokeIds.length} strokes from ${userId} in room ${roomId}`);
  
  // Move strokes from private to public
  strokeIds.forEach(strokeId => {
    const stroke = roomStore.promoteStroke(roomId, userId, strokeId);
    
    if (stroke) {
      const strokeData = {
        id: stroke.id,
        from: userId,
        stroke,
        createdAt: Date.now()
      };
      
      roomStore.addPublicStroke(roomId, strokeData);
      
      // Broadcast to room
      io.to(roomId).emit('public-stroke', strokeData);
    }
  });
};

/**
 * Handle socket disconnect
 */
const handleDisconnect = (io, socket) => {
  const { roomId, userId } = socket.data;
  console.log(`❌ Socket disconnected: ${socket.id} (User: ${userId}, Room: ${roomId})`);
  
  if (roomId && userId && roomStore.roomExists(roomId)) {
    const userFullyDisconnected = roomStore.removeUserSocket(roomId, userId, socket.id);
    
    if (userFullyDisconnected) {
      console.log(`👋 User ${userId} fully disconnected from room ${roomId}`);
    }
    
    // Notify room of user count update
    io.to(roomId).emit('users-update', { 
      count: roomStore.getUserCount(roomId)
    });
    
    // Clean up empty rooms
    if (roomStore.isEmpty(roomId)) {
      console.log(`🗑️ Cleaning up empty room: ${roomId}`);
      roomStore.deleteRoom(roomId);
    }
  }
};

module.exports = {
  handleJoinRoom,
  handlePublicStroke,
  handlePrivateStroke,
  handlePromoteStroke,
  handleDisconnect
};
