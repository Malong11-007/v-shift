import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { APIService } from './API.js';

describe('APIService offline mode', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
        global.fetch = vi.fn();
    });

    afterEach(() => {
        global.fetch = originalFetch;
        vi.restoreAllMocks();
    });

    it('mocks leaderboard calls on GitHub Pages host', async () => {
        const api = new APIService({ hostname: 'malong11-007.github.io' });
        const data = await api.getLeaderboard();

        expect(api.isOffline()).toBe(true);
        expect(data).toEqual({ scores: [] });
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('short-circuits name flows when backend is forced offline', async () => {
        const api = new APIService({ forceOffline: true, hostname: 'localhost' });

        const check = await api.checkName('GHOST');
        const register = await api.registerName('GHOST');

        expect(check.available).toBe(true);
        expect(register.offline).toBe(true);
        expect(global.fetch).not.toHaveBeenCalled();
    });
});
