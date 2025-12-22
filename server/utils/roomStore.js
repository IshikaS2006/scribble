// In-memory room storage
// Structure: rooms[roomId] = {
//   adminKey: string,
//   adminId: string,
//   publicStrokes: [{id, from, stroke, createdAt}, ...],
//   privateStrokes: { userId: [...] },
//   users: { userId: Set(socketId, ...) }
// }

class RoomStore {
  constructor() {
    this.rooms = {};
  }

  createRoom(roomId, adminKey) {
    this.rooms[roomId] = {
      adminKey,
      adminId: null,
      publicStrokes: [],
      privateStrokes: {},
      users: {},
      usersCode: {} // { userId: code }
    };
    return this.rooms[roomId];
  }

  getRoom(roomId) {
    return this.rooms[roomId];
  }

  roomExists(roomId) {
    return !!this.rooms[roomId];
  }

  deleteRoom(roomId) {
    delete this.rooms[roomId];
  }

  addUserSocket(roomId, userId, socketId) {
    const room = this.rooms[roomId];
    if (!room) return false;

    if (!room.users[userId]) {
      room.users[userId] = new Set();
    }
    room.users[userId].add(socketId);
    return true;
  }

  removeUserSocket(roomId, userId, socketId) {
    const room = this.rooms[roomId];
    if (!room || !room.users[userId]) return false;

    room.users[userId].delete(socketId);
    
    // If user has no more sockets, remove user entirely
    if (room.users[userId].size === 0) {
      delete room.users[userId];
      return true; // User fully disconnected
    }
    return false;
  }

  getUserCount(roomId) {
    const room = this.rooms[roomId];
    return room ? Object.keys(room.users).length : 0;
  }

  getUserSockets(roomId, userId) {
    const room = this.rooms[roomId];
    return room?.users[userId] || new Set();
  }

  addPublicStroke(roomId, strokeData) {
    const room = this.rooms[roomId];
    if (!room) return false;
    
    room.publicStrokes.push(strokeData);
    return true;
  }

  addPrivateStroke(roomId, userId, stroke) {
    const room = this.rooms[roomId];
    if (!room) return false;

    if (!room.privateStrokes[userId]) {
      room.privateStrokes[userId] = [];
    }
    room.privateStrokes[userId].push(stroke);
    return true;
  }

  promoteStroke(roomId, userId, strokeId) {
    const room = this.rooms[roomId];
    if (!room || !room.privateStrokes[userId]) return null;

    const strokeIndex = room.privateStrokes[userId].findIndex(s => s.id === strokeId);
    if (strokeIndex === -1) return null;

    const stroke = room.privateStrokes[userId][strokeIndex];
    room.privateStrokes[userId].splice(strokeIndex, 1);
    
    return stroke;
  }

  setAdmin(roomId, userId) {
    const room = this.rooms[roomId];
    if (!room) return false;
    
    room.adminId = userId;
    return true;
  }

  verifyAdminKey(roomId, adminKey) {
    const room = this.rooms[roomId];
    return room && room.adminKey === adminKey;
  }

  getAllRooms() {
    return this.rooms;
  }

  getTotalUsers() {
    return Object.values(this.rooms).reduce((sum, room) => 
      sum + Object.keys(room.users).length, 0
    );
  }

  isEmpty(roomId) {
    const room = this.rooms[roomId];
    return room ? Object.keys(room.users).length === 0 : true;
  }

  updateUserCode(roomId, userId, code) {
    const room = this.rooms[roomId];
    if (!room) return false;
    
    if (!room.usersCode) {
      room.usersCode = {};
    }
    room.usersCode[userId] = code;
    return true;
  }

  getUserCode(roomId, userId) {
    const room = this.rooms[roomId];
    return room?.usersCode?.[userId] || '';
  }

  getAllUsersCode(roomId) {
    const room = this.rooms[roomId];
    return room?.usersCode || {};
  }
}

module.exports = new RoomStore();
