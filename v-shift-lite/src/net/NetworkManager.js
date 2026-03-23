import { encode, decode, MSG } from './NetMessages.js';

/**
 * Singleton WebSocket client for multiplayer communication.
 */
class NetworkManager {
    constructor() {
        this.ws = null;
        this.connected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 3;
        this.reconnectDelay = 1000;
        this.handlers = new Map();
        this.serverUrl = null;
        
        // Ping tracking
        this.lastPingTime = 0;
        this.ping = 0;
    }
    
    /**
     * Connect to the WebSocket server.
     */
    connect(serverUrl) {
        return new Promise((resolve, reject) => {
            this.serverUrl = serverUrl;
            
            try {
                this.ws = new WebSocket(serverUrl);
            } catch (e) {
                console.error('[NetworkManager] Failed to create WebSocket:', e);
                reject(e);
                return;
            }
            
            this.ws.onopen = () => {
                console.log('[NetworkManager] Connected to', serverUrl);
                this.connected = true;
                this.reconnectAttempts = 0;
                
                // Start ping loop
                this.pingInterval = setInterval(() => {
                    if (this.connected) {
                        this.lastPingTime = Date.now();
                        this.send(MSG.PING, {});
                    }
                }, 5000);
                
                resolve();
            };
            
            this.ws.onmessage = (event) => {
                const msg = decode(event.data);
                if (!msg) return;
                
                // Handle pong
                if (msg.type === MSG.PONG) {
                    this.ping = Date.now() - this.lastPingTime;
                    return;
                }
                
                // Dispatch to registered handlers
                const handlers = this.handlers.get(msg.type);
                if (handlers) {
                    handlers.forEach(handler => handler(msg.data));
                }
                
                // Also dispatch as custom event for UI
                window.dispatchEvent(new CustomEvent('netMessage', { detail: msg }));
            };
            
            this.ws.onclose = () => {
                console.log('[NetworkManager] Disconnected');
                this.connected = false;
                clearInterval(this.pingInterval);
                
                // Fire disconnect event
                const handlers = this.handlers.get('disconnect');
                if (handlers) handlers.forEach(h => h());
                
                // Auto-reconnect
                if (this.reconnectAttempts < this.maxReconnectAttempts && this.serverUrl) {
                    this.reconnectAttempts++;
                    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
                    console.log(`[NetworkManager] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
                    setTimeout(() => this.connect(this.serverUrl), delay);
                }
            };
            
            this.ws.onerror = (err) => {
                console.error('[NetworkManager] WebSocket error:', err);
                reject(err);
            };
        });
    }
    
    /**
     * Disconnect from the server.
     */
    disconnect() {
        this.reconnectAttempts = this.maxReconnectAttempts; // Prevent auto-reconnect
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.connected = false;
        clearInterval(this.pingInterval);
    }
    
    /**
     * Send a message to the server.
     */
    send(type, data = {}) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.warn('[NetworkManager] Cannot send — not connected');
            return;
        }
        this.ws.send(encode(type, data));
    }
    
    /**
     * Register a handler for a message type.
     */
    on(type, handler) {
        if (!this.handlers.has(type)) {
            this.handlers.set(type, []);
        }
        this.handlers.get(type).push(handler);
    }
    
    /**
     * Remove a handler.
     */
    off(type, handler) {
        const handlers = this.handlers.get(type);
        if (handlers) {
            const idx = handlers.indexOf(handler);
            if (idx !== -1) handlers.splice(idx, 1);
        }
    }
}

const networkManager = new NetworkManager();
export default networkManager;
