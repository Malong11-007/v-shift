const express = require('express');
const router = express.Router();
const db = require('../db.js');

// GET /api/leaderboard - Top 100 scores
router.get('/', (req, res) => {
    try {
        const scores = db.getTopScores(100);
        res.json({ status: 'ok', scores });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// GET /api/leaderboard/:fingerprint - My scores
router.get('/:fingerprint', (req, res) => {
    try {
        const scores = db.getPlayerScores(req.params.fingerprint);
        res.json({ status: 'ok', scores });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// POST /api/leaderboard - Submit score
router.post('/', (req, res) => {
    const { fingerprint, callsign, kills, deaths, score, archetype, duration, mode } = req.body;
    
    // Simple validation
    if (!fingerprint || !callsign || score === undefined) {
        return res.status(400).json({ status: 'error', message: 'Missing required fields' });
    }
    
    try {
        db.insertScore({ fingerprint, callsign, kills, deaths, score, archetype, duration, mode });
        res.json({ status: 'ok' });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

module.exports = router;
