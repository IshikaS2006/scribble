const {
  handleJoinRoom,
  handlePublicStroke,
  handlePrivateStroke,
  handlePromoteStroke,
  handleDisconnect
} = require('./handlers');

/**
 * Initialize Socket.io event handlers
 * @param {Server} io - Socket.io server instance
 */
const initializeSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);
    
    // Room events
    socket.on('joinRoom', (data) => handleJoinRoom(io, socket, data));
    
    // Drawing events
    socket.on('public-stroke', (data) => handlePublicStroke(io, socket, data));
    socket.on('private-stroke', (data) => handlePrivateStroke(io, socket, data));
    socket.on('promote-stroke', (data) => handlePromoteStroke(io, socket, data));
    
    // Disconnect
    socket.on('disconnect', () => handleDisconnect(io, socket));
  });
};

module.exports = initializeSocketHandlers;
