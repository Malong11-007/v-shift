const { v4: uuidv4 } = require('uuid');

class GameRoom {
    constructor(code, hostWs, name, maxPlayers = 8) {
        this.code = code;
        this.name = name;
        this.hostWs = hostWs;
        this.maxPlayers = maxPlayers;
        this.players = new Map(); // ws → { id, name, archetype }
        this.state = 'lobby'; // 'lobby' | 'playing' | 'ended'
        this.createdAt = Date.now();
        this.emptyTimeout = null;
    }
    
    addPlayer(ws, name) {
        if (this.players.size >= this.maxPlayers) return null;
        
        const playerId = uuidv4().substring(0, 8);
        this.players.set(ws, { id: playerId, name, archetype: null });
        
        // Clear empty timeout
        if (this.emptyTimeout) {
            clearTimeout(this.emptyTimeout);
            this.emptyTimeout = null;
        }
        
        return playerId;
    }
    
    removePlayer(ws) {
        const player = this.players.get(ws);
        this.players.delete(ws);
        
        // If host leaves, assign new host
        if (ws === this.hostWs && this.players.size > 0) {
            this.hostWs = this.players.keys().next().value;
            const newHost = this.players.get(this.hostWs);
            this.broadcast(JSON.stringify({
                type: 'HOST_CHANGED',
                data: { newHostId: newHost.id }
            }));
        }
        
        // Auto-close if empty for 60s
        if (this.players.size === 0) {
            this.emptyTimeout = setTimeout(() => {
                this.state = 'ended';
            }, 60000);
        }
        
        return player;
    }
    
    broadcast(message, excludeWs = null) {
        for (const [ws] of this.players) {
            if (ws !== excludeWs && ws.readyState === 1) {
                ws.send(message);
            }
        }
    }
    
    startMatch() {
        if (this.state !== 'lobby') return false;
        this.state = 'playing';
        return true;
    }
    
    endMatch() {
        this.state = 'ended';
    }
    
    getPlayerList() {
        return Array.from(this.players.values()).map(p => ({
            id: p.id,
            name: p.name,
            archetype: p.archetype
        }));
    }
}

module.exports = GameRoom;
