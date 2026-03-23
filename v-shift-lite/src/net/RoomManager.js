import networkManager from './NetworkManager.js';
import { MSG } from './NetMessages.js';

/**
 * Client-side room management — create, join, leave rooms.
 */
class RoomManager {
    constructor() {
        this.roomCode = null;
        this.roomName = null;
        this.isHost = false;
        this.players = new Map(); // id → { name, archetype, ready }
        this.localPlayerId = null;
        
        // Listen for room events
        networkManager.on(MSG.ROOM_CREATED, (data) => this.onRoomCreated(data));
        networkManager.on(MSG.ROOM_JOINED, (data) => this.onRoomJoined(data));
        networkManager.on(MSG.PLAYER_JOINED, (data) => this.onPlayerJoined(data));
        networkManager.on(MSG.PLAYER_LEFT, (data) => this.onPlayerLeft(data));
        networkManager.on(MSG.MATCH_STARTED, (data) => this.onMatchStarted(data));
    }
    
    /**
     * Create a new room.
     */
    createRoom(name, maxPlayers = 8) {
        this.isHost = true;
        networkManager.send(MSG.CREATE_ROOM, { name, maxPlayers });
    }
    
    /**
     * Join an existing room by code.
     */
    joinRoom(code, playerName) {
        networkManager.send(MSG.JOIN_ROOM, { code, playerName });
    }
    
    /**
     * Host starts the match.
     */
    startMatch() {
        if (!this.isHost) {
            console.warn('[RoomManager] Only the host can start the match');
            return;
        }
        networkManager.send(MSG.START_MATCH, { roomCode: this.roomCode });
    }
    
    /**
     * Leave the current room.
     */
    leaveRoom() {
        networkManager.send(MSG.LEAVE_ROOM, { roomCode: this.roomCode });
        this.reset();
    }
    
    // --- Event Handlers ---
    
    onRoomCreated(data) {
        this.roomCode = data.code;
        this.roomName = data.name;
        this.localPlayerId = data.playerId;
        this.players.clear();
        this.players.set(data.playerId, { name: data.playerName, archetype: null, ready: false });
        
        window.dispatchEvent(new CustomEvent('roomCreated', { detail: data }));
    }
    
    onRoomJoined(data) {
        this.roomCode = data.code;
        this.roomName = data.name;
        this.localPlayerId = data.playerId;
        this.isHost = data.isHost || false;
        
        // Populate existing players
        this.players.clear();
        if (data.players) {
            data.players.forEach(p => this.players.set(p.id, { name: p.name, archetype: p.archetype }));
        }
        
        window.dispatchEvent(new CustomEvent('roomJoined', { detail: data }));
    }
    
    onPlayerJoined(data) {
        this.players.set(data.playerId, { name: data.playerName, archetype: null });
        window.dispatchEvent(new CustomEvent('roomPlayerJoined', { detail: data }));
    }
    
    onPlayerLeft(data) {
        this.players.delete(data.playerId);
        window.dispatchEvent(new CustomEvent('roomPlayerLeft', { detail: data }));
    }
    
    onMatchStarted(data) {
        window.dispatchEvent(new CustomEvent('matchStarted', { detail: data }));
    }
    
    reset() {
        this.roomCode = null;
        this.roomName = null;
        this.isHost = false;
        this.players.clear();
    }
}

const roomManager = new RoomManager();
export default roomManager;
