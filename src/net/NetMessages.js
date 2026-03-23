// Network message types
export const MSG = {
    // Room management
    CREATE_ROOM: 'CREATE_ROOM',
    ROOM_CREATED: 'ROOM_CREATED',
    JOIN_ROOM: 'JOIN_ROOM',
    ROOM_JOINED: 'ROOM_JOINED',
    LEAVE_ROOM: 'LEAVE_ROOM',
    PLAYER_JOINED: 'PLAYER_JOINED',
    PLAYER_LEFT: 'PLAYER_LEFT',
    START_MATCH: 'START_MATCH',
    MATCH_STARTED: 'MATCH_STARTED',
    
    // Gameplay
    PLAYER_STATE: 'PLAYER_STATE',
    PLAYER_SHOOT: 'PLAYER_SHOOT',
    PLAYER_HIT: 'PLAYER_HIT',
    PLAYER_DIED: 'PLAYER_DIED',
    PLAYER_RESPAWN: 'PLAYER_RESPAWN',
    
    // Grenades & Spike
    GRENADE_THROWN: 'GRENADE_THROWN',
    SPIKE_PLANTED: 'SPIKE_PLANTED',
    SPIKE_DEFUSED: 'SPIKE_DEFUSED',
    SPIKE_DETONATED: 'SPIKE_DETONATED',
    
    // Round
    ROUND_START: 'ROUND_START',
    ROUND_END: 'ROUND_END',
    
    // Chat
    CHAT: 'CHAT',
    
    // System
    PING: 'PING',
    PONG: 'PONG',
    ERROR: 'ERROR',
    ROOM_LIST: 'ROOM_LIST'
};

/**
 * Encode a message for WebSocket transmission.
 */
export function encode(type, data = {}) {
    return JSON.stringify({ type, data, ts: Date.now() });
}

/**
 * Decode a raw WebSocket message.
 */
export function decode(raw) {
    try {
        const parsed = JSON.parse(raw);
        return { type: parsed.type, data: parsed.data || {}, ts: parsed.ts || 0 };
    } catch {
        console.error('[NetMessages] Failed to decode:', raw);
        return null;
    }
}
