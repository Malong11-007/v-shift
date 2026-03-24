import fingerprint from './Fingerprint.js';

/**
 * Utility for making REST calls to the V-SHIFT backend.
 * Handles base URL, auth headers, and response parsing.
 */
export class APIService {
    constructor(options = {}) {
        const hostname = options.hostname ?? window.location.hostname;
        const envBase = import.meta?.env?.VITE_BACKEND_URL;
        const defaultBase = hostname === 'localhost' ? 'http://localhost:3000/api' : '/api';
        this.baseUrl = envBase || defaultBase;

        const disableBackend = import.meta?.env?.VITE_DISABLE_BACKEND === 'true';
        const runningOnGhPages = hostname?.endsWith('github.io');
        this.offline = options.forceOffline ?? (disableBackend || runningOnGhPages);
    }

    isOffline() {
        return this.offline;
    }

    async request(path, options = {}) {
        if (this.offline) {
            console.info(`[API] Offline mode active, mocking response for ${path}`);
            return this.mockResponse(path, options);
        }

        const url = `${this.baseUrl}${path}`;
        const defaultHeaders = { 'Content-Type': 'application/json' };
        
        try {
            const response = await fetch(url, {
                ...options,
                headers: { ...defaultHeaders, ...options.headers }
            });
            
            const data = await response.json();
            if (data.status === 'error') throw new Error(data.message);
            return data;
        } catch (error) {
            console.warn(`[API] Error on ${path}:`, error.message);
            throw error;
        }
    }

    mockResponse(path, options = {}) {
        if (path.startsWith('/leaderboard') && (!options.method || options.method === 'GET')) {
            return { scores: [] };
        }
        if (path.startsWith('/names/check/')) {
            return { available: true };
        }
        if (path.startsWith('/names/register')) {
            return { status: 'ok', offline: true };
        }
        if (path.startsWith('/rooms')) {
            return { rooms: [] };
        }
        return { status: 'ok', offline: true };
    }

    async getLeaderboard() {
        return this.request('/leaderboard');
    }

    async submitScore(scoreData) {
        if (this.offline) {
            return this.mockResponse('/leaderboard', { method: 'POST' });
        }
        const id = await fingerprint.get();
        return this.request('/leaderboard', {
            method: 'POST',
            body: JSON.stringify({ ...scoreData, fingerprint: id })
        });
    }

    async checkName(name) {
        return this.request(`/names/check/${encodeURIComponent(name)}`);
    }

    async registerName(name) {
        if (this.offline) {
            return this.mockResponse('/names/register');
        }
        const id = await fingerprint.get();
        return this.request('/names/register', {
            method: 'POST',
            body: JSON.stringify({ fingerprint: id, callsign: name })
        });
    }

    async getRooms() {
        return this.request('/rooms');
    }
}

const api = new APIService();
export default api;
