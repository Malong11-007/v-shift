const roomManager = require('./RoomManager.js');

function handleWebSocket(wss) {
    wss.on('connection', (ws) => {
        console.log('[WS] Client connected');
        
        ws.on('message', (raw) => {
            let msg;
            try {
                msg = JSON.parse(raw);
            } catch {
                ws.send(JSON.stringify({ type: 'ERROR', data: { message: 'Invalid JSON' } }));
                return;
            }
            
            const { type, data } = msg;
            
            switch (type) {
                case 'CREATE_ROOM': {
                    const result = roomManager.createRoom(ws, data.name || 'Unnamed', data.maxPlayers || 8);
                    if (result.error) {
                        ws.send(JSON.stringify({ type: 'ERROR', data: { message: result.error } }));
                    } else {
                        ws.send(JSON.stringify({ type: 'ROOM_CREATED', data: result }));
                    }
                    break;
                }
                
                case 'JOIN_ROOM': {
                    const result = roomManager.joinRoom(data.code, ws, data.playerName || 'Player');
                    if (result.error) {
                        ws.send(JSON.stringify({ type: 'ERROR', data: { message: result.error } }));
                    } else {
                        ws.send(JSON.stringify({ type: 'ROOM_JOINED', data: result }));
                        
                        // Broadcast to room
                        const room = roomManager.getRoomForWs(ws);
                        if (room) {
                            room.broadcast(JSON.stringify({
                                type: 'PLAYER_JOINED',
                                data: { playerId: result.playerId, playerName: data.playerName }
                            }), ws);
                        }
                    }
                    break;
                }
                
                case 'START_MATCH': {
                    const room = roomManager.getRoomForWs(ws);
                    if (!room) break;
                    if (ws !== room.hostWs) {
                        ws.send(JSON.stringify({ type: 'ERROR', data: { message: 'Only host can start' } }));
                        break;
                    }
                    if (room.startMatch()) {
                        room.broadcast(JSON.stringify({ type: 'MATCH_STARTED', data: {} }));
                    }
                    break;
                }
                
                case 'LEAVE_ROOM': {
                    const result = roomManager.removePlayer(ws);
                    if (result && result.room && result.player) {
                        result.room.broadcast(JSON.stringify({
                            type: 'PLAYER_LEFT',
                            data: { playerId: result.player.id, playerName: result.player.name }
                        }));
                    }
                    break;
                }
                
                // Relay gameplay messages to room
                case 'PLAYER_STATE':
                case 'PLAYER_SHOOT':
                case 'PLAYER_HIT':
                case 'PLAYER_DIED':
                case 'PLAYER_RESPAWN':
                case 'GRENADE_THROWN':
                case 'SPIKE_PLANTED':
                case 'SPIKE_DEFUSED':
                case 'SPIKE_DETONATED':
                case 'CHAT': {
                    const room = roomManager.getRoomForWs(ws);
                    if (room) {
                        room.broadcast(JSON.stringify({ type, data }), ws);
                    }
                    break;
                }
                
                case 'PING': {
                    ws.send(JSON.stringify({ type: 'PONG', data: {} }));
                    break;
                }
                
                case 'ROOM_LIST': {
                    ws.send(JSON.stringify({ type: 'ROOM_LIST', data: { rooms: roomManager.getPublicRooms() } }));
                    break;
                }
                
                default:
                    console.log('[WS] Unknown message type:', type);
            }
        });
        
        ws.on('close', () => {
            console.log('[WS] Client disconnected');
            const result = roomManager.removePlayer(ws);
            if (result && result.room && result.player) {
                result.room.broadcast(JSON.stringify({
                    type: 'PLAYER_LEFT',
                    data: { playerId: result.player.id, playerName: result.player.name }
                }));
            }
        });
    });
}

module.exports = handleWebSocket;
