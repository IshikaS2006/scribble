const {
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
    socket.on('request-promote', () => handleRequestPromote(io, socket));
    
    // Code editor events
    socket.on('code-update', (data) => handleCodeUpdate(io, socket, data));
    
    // Cursor presence events
    socket.on('cursor-move', (data) => handleCursorMove(io, socket, data));
    
    // Live stroke events
    socket.on('live-stroke', (data) => handleLiveStroke(io, socket, data));
    socket.on('live-stroke-end', () => handleLiveStrokeEnd(io, socket));
    
    // Disconnect
    socket.on('disconnect', () => handleDisconnect(io, socket));
  });
};

module.exports = initializeSocketHandlers;
