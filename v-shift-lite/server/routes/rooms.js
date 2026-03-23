const express = require('express');
const router = express.Router();
const roomManager = require('../RoomManager.js');

// GET /api/rooms - List all joinable rooms
router.get('/', (req, res) => {
    try {
        const rooms = roomManager.getPublicRooms();
        res.json({ status: 'ok', rooms });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

module.exports = router;
