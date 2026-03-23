import fingerprint from './Fingerprint.js';

/**
 * Utility for making REST calls to the V-SHIFT backend.
 * Handles base URL, auth headers, and response parsing.
 */
class APIService {
    constructor() {
        this.baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : '/api';
    }

    async request(path, options = {}) {
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

    async getLeaderboard() {
        return this.request('/leaderboard');
    }

    async submitScore(scoreData) {
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
