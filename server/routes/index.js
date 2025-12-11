const express = require('express');
const router = express.Router();
const { createRoom, getHealthStatus } = require('../controllers/roomController');

// Health check
router.get('/', getHealthStatus);

// Room management
router.post('/rooms', createRoom);

module.exports = router;
