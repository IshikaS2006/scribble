const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);

// Configure CORS
app.use(cors());

// Socket.io setup with CORS
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174"], // Vite's default and alternative ports
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// Store active connections
const connectedUsers = new Map();

// Socket.io connection handler
io.on('connection', (socket) => {
  const userId = uuidv4();
  console.log(`✅ User connected: ${userId} (Socket: ${socket.id})`);
  
  connectedUsers.set(socket.id, userId);
  
  // Send connection confirmation to client
  socket.emit('connected', { userId, socketId: socket.id });
  
  // Broadcast current user count
  io.emit('users-update', { count: connectedUsers.size });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${userId} (Socket: ${socket.id})`);
    connectedUsers.delete(socket.id);
    io.emit('users-update', { count: connectedUsers.size });
  });
  
  // Handle drawing events (for future use)
  socket.on('draw', (data) => {
    socket.broadcast.emit('draw', data);
  });
  
  // Handle clearing canvas (for future use)
  socket.on('clear', () => {
    socket.broadcast.emit('clear');
  });
});

// Basic health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'Server is running',
    connectedUsers: connectedUsers.size,
    timestamp: new Date().toISOString()
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Socket.io ready for connections`);
});
