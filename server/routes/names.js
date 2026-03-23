const express = require('express');
const router = express.Router();
const db = require('../db.js');

// GET /api/name/check/:name - Availability check
router.get('/check/:name', (req, res) => {
    const { name } = req.params;
    if (!name || name.length < 3) {
        return res.json({ status: 'ok', available: false, message: 'Too short' });
    }
    
    try {
        const available = db.checkName(name);
        res.json({ status: 'ok', available });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// POST /api/name/register - Persist callsign
router.post('/register', (req, res) => {
    const { fingerprint, callsign } = req.body;
    
    if (!fingerprint || !callsign || callsign.length < 3) {
        return res.status(400).json({ status: 'error', message: 'Invalid registration' });
    }
    
    try {
        db.registerName(fingerprint, callsign);
        res.json({ status: 'ok' });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

module.exports = router;
