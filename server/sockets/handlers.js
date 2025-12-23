const { v4: uuidv4 } = require('uuid');
const roomStore = require('../utils/roomStore');
const Room = require('../models/Room');
const PublicStroke = require('../models/PublicStroke');
const UserCode = require('../models/UserCode');

/**
 * Handle user joining a room
 */
const handleJoinRoom = async (io, socket, { roomId, userId, adminKey }) => {
  console.log(`👤 joinRoom request - Room: ${roomId}, User: ${userId}, AdminKey: ${adminKey ? '***' : 'none'}`);
  
  if (!roomId || !userId) {
    socket.emit('error', { message: 'roomId and userId are required' });
    return;
  }
  
  // Check if room exists - don't auto-create
  if (!roomStore.roomExists(roomId)) {
    console.log(`❌ Room ${roomId} does not exist in memory`);
    
    // ✅ TASK 1: Try loading room and strokes from database
    try {
      const dbRoom = await Room.findOne({ roomId });
      if (dbRoom) {
        console.log(`📥 Loading room from DB: ${roomId}`);
        roomStore.createRoom(roomId, dbRoom.adminKey);
        
        // ✅ TASK 1: Load public strokes from PublicStroke collection
        const publicStrokes = await PublicStroke.find({ roomId }).sort({ createdAt: 1 });
        if (publicStrokes.length > 0) {
          publicStrokes.forEach(stroke => {
            roomStore.addPublicStroke(roomId, {
              id: stroke.strokeId,
              from: stroke.authorId,
              stroke: {
                id: stroke.strokeId,
                points: stroke.points,
                color: stroke.color,
                width: stroke.width
              },
              createdAt: stroke.createdAt
            });
          });
          console.log(`📦 Loaded ${publicStrokes.length} public strokes from DB`);
        }
        
        // Load user codes from UserCode collection
        const userCodes = await UserCode.find({ roomId }).sort({ updatedAt: -1 });
        if (userCodes.length > 0) {
          userCodes.forEach(userCode => {
            roomStore.updateUserCode(roomId, userCode.userId, userCode.code);
          });
          console.log(`💻 Loaded code from ${userCodes.length} users from DB`);
        }
        
        if (dbRoom.adminId) {
          roomStore.setAdmin(roomId, dbRoom.adminId);
        }
      } else {
        socket.emit('error', { 
          message: 'Room does not exist. Create a room first via POST /rooms' 
        });
        return;
      }
    } catch (dbError) {
      console.log('⚠️ DB lookup failed:', dbError.message);
      socket.emit('error', { 
        message: 'Room does not exist. Create a room first via POST /rooms' 
      });
      return;
    }
  }
  
  const room = roomStore.getRoom(roomId);
  
  // Check admin status
  socket.data.userId = userId;
  socket.data.roomId = roomId;
  socket.data.isAdmin = false;
  
  // Verify adminKey if provided
  console.log(`🔑 Admin verification - Provided adminKey: ${adminKey ? adminKey : 'NONE'}`);
  console.log(`🔑 Room adminKey: ${room.adminKey}`);
  console.log(`🔑 Keys match: ${adminKey === room.adminKey}`);
  
  if (adminKey && roomStore.verifyAdminKey(roomId, adminKey)) {
    socket.data.isAdmin = true;
    if (!room.adminId) {
      roomStore.setAdmin(roomId, userId);
      console.log(`👑 Admin set for room ${roomId}: ${userId}`);
    }
  } else {
    console.log(`❌ Admin verification FAILED for user ${userId}`);
  }
  
  // Add userId -> socketId mapping
  roomStore.addUserSocket(roomId, userId, socket.id);
  
  // Join socket.io room
  socket.join(roomId);
  
  console.log(`✅ User ${userId} joined room ${roomId} (Admin: ${socket.data.isAdmin})`);
  console.log(`📊 Room ${roomId} now has ${roomStore.getUserCount(roomId)} users`);
  console.log(`👥 Users in room:`, Object.keys(roomStore.getRoom(roomId).users));
  
  // SEND EXPLICIT JOIN-ACK BACK TO CLIENT
  socket.emit("join-ack", {
    roomId,
    userId,
    isAdmin: socket.data.isAdmin
  });
  console.log(`📤 Sent join-ack with isAdmin: ${socket.data.isAdmin}`);
  // Send room state to the joining user
  const roomJoinedData = {
    roomId,
    userId,
    isAdmin: socket.data.isAdmin,
    // Unwrap stored strokes (they're stored as {id, from, stroke, createdAt})
    publicStrokes: room.publicStrokes.map(s => s.stroke),
    userCount: roomStore.getUserCount(roomId)
  };

  // ✅ STEP 7: Include user's private strokes (multi-tab support)
  if (room.privateStrokes && room.privateStrokes[userId]) {
    roomJoinedData.privateStrokes = room.privateStrokes[userId];
    console.log(`📦 Sending ${roomJoinedData.privateStrokes.length} private strokes to ${userId}`);
  } else {
    console.log(`📦 No private strokes for ${userId}`);
  }

  // ✅ STEP 9: If admin, send ALL private strokes from all users for promotion
  if (socket.data.isAdmin && room.privateStrokes) {
    roomJoinedData.allPrivateStrokes = {};
    for (const [uid, strokes] of Object.entries(room.privateStrokes)) {
      if (strokes.length > 0) {
        roomJoinedData.allPrivateStrokes[uid] = strokes;
      }
    }
    const totalCount = Object.values(roomJoinedData.allPrivateStrokes).reduce((sum, arr) => sum + arr.length, 0);
    console.log(`👑 Sending ${totalCount} private strokes from ${Object.keys(roomJoinedData.allPrivateStrokes).length} users to admin`);
    
    // Send all users' code to admin
    roomJoinedData.allUsersCode = roomStore.getAllUsersCode(roomId);
    console.log(`💻 Sending code from ${Object.keys(roomJoinedData.allUsersCode).length} users to admin`);
  }

  // Send user's own code
  roomJoinedData.myCode = roomStore.getUserCode(roomId, userId);

  socket.emit('room-joined', roomJoinedData);
  
  // Notify room of user count update
  io.to(roomId).emit('users-update', { 
    count: roomStore.getUserCount(roomId)
  });
  
  // Notify admin about new user joining (so they appear in code viewer dropdown)
  if (!socket.data.isAdmin) {
    socket.to(roomId).emit('user-joined', { 
      userId,
      code: roomStore.getUserCode(roomId, userId) || ''
    });
  }
};

/**
 * Handle public stroke
 */
const handlePublicStroke = async (io, socket, stroke) => {
  const { roomId, userId } = socket.data;
  
  if (!roomId || !userId) {
    console.log('⚠️ public-stroke: No room/user data');
    return;
  }
  
  if (!roomStore.roomExists(roomId)) {
    console.log(`⚠️ public-stroke: Room ${roomId} not found`);
    return;
  }
  
  // Add metadata for storage
  const strokeData = {
    id: stroke.id || uuidv4(),
    from: userId,
    stroke,
    createdAt: Date.now()
  };
  
  roomStore.addPublicStroke(roomId, strokeData);
  console.log(`📤 public-stroke from ${userId} in room ${roomId}`);
  
  // ✅ TASK 1: Save to PublicStroke collection
  try {
    await PublicStroke.create({
      roomId,
      strokeId: stroke.id,
      authorId: userId,
      points: stroke.points,
      color: stroke.color,
      width: stroke.width
    });
    console.log(`💾 Stroke saved to DB`);
  } catch (dbError) {
    console.log('⚠️ DB save failed:', dbError.message);
  }
  
  // Broadcast just the stroke (not wrapped) to all in room except sender
  socket.to(roomId).emit('public-stroke', stroke);
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

  // ✅ STEP 9: Notify admin about new private strokes
  const room = roomStore.getRoom(roomId);
  if (room.adminId && room.adminId !== userId) {
    const adminSockets = roomStore.getUserSockets(roomId, room.adminId);
    adminSockets.forEach(adminSocketId => {
      io.to(adminSocketId).emit('private-stroke-from-other', {
        userId,
        stroke
      });
    });
    console.log(`👑 Notified admin about private stroke from ${userId}`);
  }
};

/**
 * Handle promote stroke (private -> public)
 */
const handlePromoteStroke = async (io, socket, { strokeIds }) => {
  const { roomId, userId } = socket.data;
  
  if (!roomId || !userId) {
    console.log('⚠️ promote-stroke: No room/user data');
    return;
  }
  
  if (!socket.data.isAdmin) {
    console.log('⚠️ promote-stroke: User is not admin');
    socket.emit('error', { message: 'Only admin can promote strokes' });
    return;
  }
  
  if (!roomStore.roomExists(roomId)) {
    console.log(`⚠️ promote-stroke: Room ${roomId} not found`);
    return;
  }
  
  console.log(`📢 promote-stroke: ${strokeIds.length} strokes in room ${roomId}`);
  
  // Move strokes from private to public
  for (const strokeId of strokeIds) {
    // Find the stroke across all users' private strokes
    const room = roomStore.getRoom(roomId);
    let foundStroke = null;
    let strokeOwnerId = null;
    
    if (room.privateStrokes) {
      for (const [uid, strokes] of Object.entries(room.privateStrokes)) {
        const stroke = strokes.find(s => s.id === strokeId);
        if (stroke) {
          foundStroke = stroke;
          strokeOwnerId = uid;
          break;
        }
      }
    }
    
    if (foundStroke) {
      // Remove from private
      roomStore.promoteStroke(roomId, strokeOwnerId, strokeId);
      
      // Add to public
      const strokeData = {
        id: foundStroke.id,
        from: strokeOwnerId,
        stroke: foundStroke,
        createdAt: Date.now()
      };
      
      roomStore.addPublicStroke(roomId, strokeData);
      
      // ✅ TASK 1: Save promoted stroke to PublicStroke collection
      try {
        await PublicStroke.create({
          roomId,
          strokeId: foundStroke.id,
          authorId: strokeOwnerId,
          points: foundStroke.points,
          color: foundStroke.color,
          width: foundStroke.width
        });
        console.log(`💾 Promoted stroke saved to DB`);
      } catch (dbError) {
        console.log('⚠️ DB save failed:', dbError.message);
      }
      
      // Broadcast to everyone as a public stroke
      io.to(roomId).emit('public-stroke', foundStroke);
      
      // Notify about promotion
      io.to(roomId).emit('stroke-promoted', { 
        strokeId: foundStroke.id, 
        userId: strokeOwnerId 
      });
      
      console.log(`✅ Promoted stroke ${strokeId} from ${strokeOwnerId} to public`);
    } else {
      console.log(`⚠️ Stroke ${strokeId} not found in private strokes`);
    }
  }
};

/**
 * Handle request to promote (student asks admin to show their work)
 */
const handleRequestPromote = (io, socket) => {
  const { roomId, userId } = socket.data;
  
  if (!roomId || !userId) {
    console.log('⚠️ request-promote: No room/user data');
    return;
  }
  
  if (socket.data.isAdmin) {
    console.log('⚠️ request-promote: Admin cannot request (they promote directly)');
    return;
  }
  
  if (!roomStore.roomExists(roomId)) {
    console.log(`⚠️ request-promote: Room ${roomId} not found`);
    return;
  }
  
  console.log(`🙋 User ${userId} requesting promotion in room ${roomId}`);
  
  // Get admin's sockets
  const room = roomStore.getRoom(roomId);
  if (room.adminId) {
    const adminSockets = roomStore.getUserSockets(roomId, room.adminId);
    
    // Get user's private stroke count
    const strokeCount = room.privateStrokes && room.privateStrokes[userId] 
      ? room.privateStrokes[userId].length 
      : 0;
    
    // Send request notification to admin
    adminSockets.forEach(adminSocketId => {
      io.to(adminSocketId).emit('promote-request', {
        userId,
        strokeCount,
        timestamp: Date.now()
      });
    });
    
    console.log(`📬 Promotion request sent to admin from ${userId}`);
    
    // Confirm to student
    socket.emit('promote-request-sent', {
      success: true,
      message: 'Request sent to teacher'
    });
  } else {
    socket.emit('promote-request-sent', {
      success: false,
      message: 'No teacher in room'
    });
  }
};

/**
 * Handle code update
 */
const handleCodeUpdate = async (io, socket, { code }) => {
  const { roomId, userId } = socket.data;
  
  if (!roomId || !userId) {
    console.log('⚠️ code-update: No room/user data');
    return;
  }
  
  if (!roomStore.roomExists(roomId)) {
    console.log(`⚠️ code-update: Room ${roomId} not found`);
    return;
  }
  
  // Store the code in memory
  roomStore.updateUserCode(roomId, userId, code);
  console.log(`💻 Code update from ${userId} in room ${roomId} (${code.length} chars)`);
  
  // Save to database with upsert (update if exists, create if not)
  try {
    await UserCode.findOneAndUpdate(
      { roomId, userId },
      { 
        code, 
        updatedAt: Date.now() 
      },
      { 
        upsert: true, 
        new: true 
      }
    );
    console.log(`💾 Code saved to DB for user ${userId}`);
  } catch (dbError) {
    console.log('⚠️ DB save failed:', dbError.message);
  }
  
  // Broadcast code update to all users in the room (including sender for multi-tab)
  io.to(roomId).emit('code-update', { userId, code });
};

/**
 * Handle cursor movement (all users)
 */
const handleCursorMove = (io, socket, { x, y }) => {
  const { roomId, userId } = socket.data;
  
  if (!roomId || !userId) {
    return;
  }
  
  if (!roomStore.roomExists(roomId)) {
    return;
  }
  
  // Broadcast cursor position to all other users in the room
  socket.to(roomId).emit('cursor-move', { userId, x, y });
};

/**
 * Handle live stroke update (broadcast to room for real-time viewing)
 */
const handleLiveStroke = (io, socket, strokeData) => {
  const { roomId, userId } = socket.data;
  
  if (!roomId || !userId) {
    return;
  }
  
  if (!roomStore.roomExists(roomId)) {
    return;
  }
  
  // Broadcast live stroke to all other users in the room
  socket.to(roomId).emit('live-stroke', { userId, stroke: strokeData });
};

/**
 * Handle live stroke end (notify when drawing completes)
 */
const handleLiveStrokeEnd = (io, socket) => {
  const { roomId, userId } = socket.data;
  
  if (!roomId || !userId) {
    return;
  }
  
  if (!roomStore.roomExists(roomId)) {
    return;
  }
  
  // Notify room that user finished their stroke
  socket.to(roomId).emit('live-stroke-end', { userId });
};

/**
 * Handle socket disconnect
/**
 * Handle socket disconnect
 */
const handleDisconnect = (io, socket) => {
  const { roomId, userId } = socket.data;
  
  // Only log if user actually joined a room
  if (roomId && userId) {
    console.log(`❌ Socket disconnected: ${socket.id} (User: ${userId}, Room: ${roomId})`);
  } else {
    console.log(`🔌 Socket disconnected without joining: ${socket.id}`);
  }
  
  if (roomId && userId && roomStore.roomExists(roomId)) {
    const userFullyDisconnected = roomStore.removeUserSocket(roomId, userId, socket.id);
    
    if (userFullyDisconnected) {
      console.log(`👋 User ${userId} fully disconnected from room ${roomId}`);
    }
    
    // Notify room of user count update
    io.to(roomId).emit('users-update', { 
      count: roomStore.getUserCount(roomId)
    });
    
    // Notify others that this user left
    socket.to(roomId).emit('user-left', { userId });
    
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
  handleRequestPromote,
  handleCodeUpdate,
  handleCursorMove,
  handleLiveStroke,
  handleLiveStrokeEnd,
  handleDisconnect
};
