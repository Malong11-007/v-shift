import { describe, it, expect, beforeEach, vi } from 'vitest';
import roundManager, { ROUND_STATES } from './RoundManager.js';

describe('RoundManager', () => {
    beforeEach(() => {
        // Reset internal state
        roundManager.currentRound = 1;
        roundManager.overtime = false;
        roundManager.state = ROUND_STATES.FREEZE_TIME;
        roundManager.timer = 0;
        vi.restoreAllMocks();
    });

    it('should initialize with correct default stats', () => {
        expect(roundManager.state).toBe(ROUND_STATES.FREEZE_TIME);
        expect(roundManager.currentRound).toBe(1);
        expect(roundManager.durations.FREEZE_TIME).toBe(10);
        expect(roundManager.durations.LIVE).toBe(90);
        expect(roundManager.durations.POST_ROUND).toBe(5);
    });

    it('should start a match at round 1', () => {
        const spy = vi.spyOn(roundManager, 'startRound');
        roundManager.currentRound = 5; // Simulate mid-game
        roundManager.overtime = true;

        roundManager.startMatch();

        expect(roundManager.currentRound).toBe(1);
        expect(roundManager.overtime).toBe(false);
        expect(spy).toHaveBeenCalled();
    });

    it('should transition to FREEZE_TIME when starting a round', () => {
        const spy = vi.spyOn(window, 'dispatchEvent');
        roundManager.startRound();

        expect(roundManager.state).toBe(ROUND_STATES.FREEZE_TIME);
        expect(roundManager.timer).toBe(10);
        
        const eventArgs = spy.mock.calls.find(call => call[0].type === 'roundStarted');
        expect(eventArgs).toBeDefined();
        expect(eventArgs[0].detail.round).toBe(1);
    });

    it('should end a round and transition to POST_ROUND', () => {
        const spy = vi.spyOn(window, 'dispatchEvent');
        roundManager.state = ROUND_STATES.LIVE;

        roundManager.endRound('ATTACKERS', 'ELIMINATION');

        expect(roundManager.state).toBe(ROUND_STATES.POST_ROUND);
        expect(roundManager.timer).toBe(5);

        const eventArgs = spy.mock.calls.find(call => call[0].type === 'roundEnded');
        expect(eventArgs).toBeDefined();
        expect(eventArgs[0].detail).toEqual({ winner: 'ATTACKERS', reason: 'ELIMINATION' });
    });

    it('should prevent ending a round if already in POST_ROUND', () => {
        const spy = vi.spyOn(window, 'dispatchEvent');
        roundManager.state = ROUND_STATES.POST_ROUND;

        roundManager.endRound('ATTACKERS', 'ELIMINATION');

        // Should not dispatch new events or reset timer
        expect(spy).not.toHaveBeenCalled();
    });

    it('should transition from FREEZE_TIME to LIVE upon timer expiration', () => {
        roundManager.state = ROUND_STATES.FREEZE_TIME;
        roundManager.timer = 1;

        roundManager.update(1.1); // Exceed timer

        expect(roundManager.state).toBe(ROUND_STATES.LIVE);
        expect(roundManager.timer).toBe(90);
    });

    it('should transition from LIVE to POST_ROUND upon timer expiration (Defenders Win)', () => {
        const spy = vi.spyOn(roundManager, 'endRound');
        roundManager.state = ROUND_STATES.LIVE;
        roundManager.timer = 1;

        roundManager.update(1.1); // Exceed timer

        expect(spy).toHaveBeenCalledWith('DEFENDERS', 'TIME_EXPIRED');
    });

    it('should transition from POST_ROUND to next round upon timer expiration', () => {
        const spy = vi.spyOn(roundManager, 'startRound');
        roundManager.state = ROUND_STATES.POST_ROUND;
        roundManager.timer = 1;
        roundManager.currentRound = 3;

        roundManager.update(1.1); // Exceed timer

        expect(roundManager.currentRound).toBe(4); // Increment round
        expect(spy).toHaveBeenCalled();
    });
});
