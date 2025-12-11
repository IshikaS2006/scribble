const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const config = require('./config');
const routes = require('./routes');
const initializeSocketHandlers = require('./sockets');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({ origin: config.frontendOrigin }));
app.use(express.json());

// Socket.io setup
const io = new Server(server, {
  cors: config.cors
});

// Initialize socket handlers
initializeSocketHandlers(io);

// REST API routes
app.use('/', routes);

// Start server
server.listen(config.port, () => {
  console.log(`🚀 Server running on http://localhost:${config.port}`);
  console.log(`📡 Socket.io ready for connections`);
  console.log(`🌐 CORS origin: ${config.frontendOrigin}`);
  console.log(`🔧 Environment: ${config.nodeEnv}`);
});
