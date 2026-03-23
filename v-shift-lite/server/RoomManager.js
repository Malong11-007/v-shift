const GameRoom = require('./GameRoom.js');

class RoomManager {
    constructor() {
        this.rooms = new Map(); // code → GameRoom
        this.playerRooms = new Map(); // ws → roomCode
        this.maxRooms = 20;
    }
    
    generateCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let code;
        do {
            code = '';
            for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
        } while (this.rooms.has(code));
        return code;
    }
    
    createRoom(hostWs, name, maxPlayers = 8) {
        if (this.rooms.size >= this.maxRooms) {
            return { error: 'Maximum rooms reached' };
        }
        
        const code = this.generateCode();
        const room = new GameRoom(code, hostWs, name, Math.min(maxPlayers, 8));
        this.rooms.set(code, room);
        
        const playerId = room.addPlayer(hostWs, name);
        this.playerRooms.set(hostWs, code);
        
        return { code, playerId, playerName: name };
    }
    
    joinRoom(code, ws, playerName) {
        const room = this.rooms.get(code);
        if (!room) return { error: 'Room not found' };
        if (room.state !== 'lobby') return { error: 'Match already in progress' };
        if (room.players.size >= room.maxPlayers) return { error: 'Room is full' };
        
        const playerId = room.addPlayer(ws, playerName);
        this.playerRooms.set(ws, code);
        
        return { 
            code: room.code,
            name: room.name,
            playerId,
            isHost: ws === room.hostWs,
            players: room.getPlayerList()
        };
    }
    
    removePlayer(ws) {
        const code = this.playerRooms.get(ws);
        if (!code) return;
        
        const room = this.rooms.get(code);
        if (!room) return;
        
        const player = room.removePlayer(ws);
        this.playerRooms.delete(ws);
        
        // Remove room if ended or empty
        if (room.state === 'ended' || room.players.size === 0) {
            this.rooms.delete(code);
        }
        
        return { player, room };
    }
    
    getRoomForWs(ws) {
        const code = this.playerRooms.get(ws);
        return code ? this.rooms.get(code) : null;
    }
    
    getPublicRooms() {
        const list = [];
        for (const [code, room] of this.rooms) {
            if (room.state === 'lobby') {
                list.push({
                    code,
                    name: room.name,
                    playerCount: room.players.size,
                    maxPlayers: room.maxPlayers
                });
            }
        }
        return list;
    }
}

module.exports = new RoomManager();
