import { io } from 'socket.io-client';
import config from './config';

const socket = io(config.server.url, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: config.server.reconnectionAttempts,
  reconnectionDelay: config.server.reconnectionDelay,
});

if (config.features.enableLogging) {
  socket.on('connect', () => console.info('Socket connected:', socket.id));
  socket.on('disconnect', (reason) => console.info('Socket disconnected:', reason));
  socket.on('connect_error', (error) => console.error('Connection error:', error.message));
}

export default socket;
