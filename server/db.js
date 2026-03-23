const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'vshift.db');

let db;

async function initDB() {
    const SQL = await initSqlJs();
    
    // Ensure data directory exists
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    // Load existing DB or create new
    if (fs.existsSync(DB_PATH)) {
        const buffer = fs.readFileSync(DB_PATH);
        db = new SQL.Database(buffer);
    } else {
        db = new SQL.Database();
    }
    
    // Create tables
    db.run(`
        CREATE TABLE IF NOT EXISTS scores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fingerprint TEXT NOT NULL,
            callsign TEXT NOT NULL,
            kills INTEGER DEFAULT 0,
            deaths INTEGER DEFAULT 0,
            score INTEGER DEFAULT 0,
            archetype TEXT DEFAULT 'KINETIC',
            duration INTEGER DEFAULT 0,
            mode TEXT DEFAULT 'COMPETITIVE',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    
    db.run(`
        CREATE TABLE IF NOT EXISTS players (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fingerprint TEXT UNIQUE NOT NULL,
            callsign TEXT UNIQUE NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    
    console.log('[DB] SQLite initialized');
    return db;
}

function saveDB() {
    if (!db) return;
    const data = db.export();
    const buffer = Buffer.from(data);
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_PATH, buffer);
}

function insertScore(data) {
    const stmt = db.prepare(`
        INSERT INTO scores (fingerprint, callsign, kills, deaths, score, archetype, duration, mode)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run([data.fingerprint, data.callsign, data.kills, data.deaths, data.score, data.archetype, data.duration, data.mode]);
    stmt.free();
    saveDB();
}

function getTopScores(limit = 100) {
    const stmt = db.prepare('SELECT * FROM scores ORDER BY score DESC LIMIT ?');
    stmt.bind([limit]);
    const results = [];
    while (stmt.step()) results.push(stmt.getAsObject());
    stmt.free();
    return results;
}

function getPlayerScores(fingerprint) {
    const stmt = db.prepare('SELECT * FROM scores WHERE fingerprint = ? ORDER BY created_at DESC');
    stmt.bind([fingerprint]);
    const results = [];
    while (stmt.step()) results.push(stmt.getAsObject());
    stmt.free();
    return results;
}

function checkName(callsign) {
    const stmt = db.prepare('SELECT COUNT(*) as cnt FROM players WHERE LOWER(callsign) = LOWER(?)');
    stmt.bind([callsign]);
    stmt.step();
    const result = stmt.getAsObject();
    stmt.free();
    return result.cnt === 0;
}

function registerName(fingerprint, callsign) {
    const stmt = db.prepare('INSERT INTO players (fingerprint, callsign) VALUES (?, ?)');
    stmt.run([fingerprint, callsign]);
    stmt.free();
    saveDB();
}

module.exports = { initDB, insertScore, getTopScores, getPlayerScores, checkName, registerName, saveDB };
