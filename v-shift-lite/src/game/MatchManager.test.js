import { describe, it, expect, beforeEach, vi } from 'vitest';
import matchManager, { GAME_MODES } from './MatchManager.js';
import roundManager, { ROUND_STATES } from './RoundManager.js';
import economyManager from './EconomyManager.js';

describe('MatchManager', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('should initialize in COMPETITIVE mode', () => {
        expect(matchManager.currentMode).toBe(GAME_MODES.COMPETITIVE);
    });

    it('should set COMPETITIVE mode and reset economy/rounds', () => {
        const roundSpy = vi.spyOn(roundManager, 'startMatch');
        const econSpy = vi.spyOn(economyManager, 'reset');

        matchManager.setMode(GAME_MODES.COMPETITIVE);

        expect(matchManager.currentMode).toBe(GAME_MODES.COMPETITIVE);
        expect(roundSpy).toHaveBeenCalled();
        expect(econSpy).toHaveBeenCalled();
    });

    it('should set DEATHMATCH mode, grant infinite cash, and start extremely long LIVE round', () => {
        const transitionSpy = vi.spyOn(roundManager, 'transition');

        matchManager.setMode(GAME_MODES.DEATHMATCH);

        expect(matchManager.currentMode).toBe(GAME_MODES.DEATHMATCH);
        expect(economyManager.cash).toBe(99999);
        expect(roundManager.durations.LIVE).toBe(600);
        expect(transitionSpy).toHaveBeenCalledWith(ROUND_STATES.LIVE);
    });

    it('should set GUN_GAME mode and start extremely long LIVE round', () => {
        const transitionSpy = vi.spyOn(roundManager, 'transition');

        matchManager.setMode(GAME_MODES.GUN_GAME);

        expect(matchManager.currentMode).toBe(GAME_MODES.GUN_GAME);
        expect(roundManager.durations.LIVE).toBe(1800);
        expect(transitionSpy).toHaveBeenCalledWith(ROUND_STATES.LIVE);
    });

    it('should log kills specifically for GUN_GAME logic', () => {
        matchManager.setMode(GAME_MODES.GUN_GAME);
        const spyLog = vi.spyOn(console, 'log');

        matchManager.handleKill({ detail: { weaponId: 'SIDEARM' } });

        expect(spyLog).toHaveBeenCalledWith(expect.stringContaining('Gun Game Kill'));
    });
});
