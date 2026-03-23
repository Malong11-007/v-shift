const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const db = require('./db.js');
const handleWebSocket = require('./wsHandler.js');

// Routes
const leaderboardRouter = require('./routes/leaderboard.js');
const roomsRouter = require('./routes/rooms.js');
const namesRouter = require('./routes/names.js');

// Middleware
const { globalLimit } = require('./middleware/rateLimit.js');

const PORT = process.env.PORT || 3000;

async function start() {
    // 1. Init Database
    await db.initDB();
    
    const app = express();
    const server = http.createServer(app);
    const wss = new WebSocketServer({ server });

    // 2. Middleware
    app.use(helmet());
    app.use(cors());
    app.use(express.json());
    app.use(globalLimit);

    // 3. REST Routes
    app.use('/api/leaderboard', leaderboardRouter);
    app.use('/api/rooms', roomsRouter);
    app.use('/api/names', namesRouter);
    
    app.get('/api/health', (req, res) => {
        res.json({ status: 'ok', timestamp: Date.now() });
    });

    // 4. WebSocket Handler
    handleWebSocket(wss);

    // 5. Start Server
    server.listen(PORT, '0.0.0.0', () => {
        console.log(`[Server] V-SHIFT backend LIVE on port ${PORT}`);
    });
}

start().catch(err => {
    console.error('[Server] Critical startup error:', err);
    process.exit(1);
});
