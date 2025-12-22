const express = require('express');
const router = express.Router();
const { createRoom, getHealthStatus } = require('../controllers/roomController');

// Health check
router.get('/', getHealthStatus);
router.get('/health', getHealthStatus); // For uptime monitoring

// Room management
router.post('/rooms', createRoom);

module.exports = router;
