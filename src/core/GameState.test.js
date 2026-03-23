import { describe, it, expect, beforeEach, vi } from 'vitest';
import gameState, { STATES } from './GameState.js';

describe('GameState', () => {
    beforeEach(() => {
        // Reset state before each test if possible, or just check transitions
        gameState.currentState = STATES.LOADING;
    });

    it('should initialize with LOADING state', () => {
        expect(gameState.currentState).toBe(STATES.LOADING);
    });

    it('should transition correctly between states', () => {
        gameState.transition(STATES.MAIN_MENU);
        expect(gameState.currentState).toBe(STATES.MAIN_MENU);
        
        gameState.transition(STATES.PLAYING);
        expect(gameState.currentState).toBe(STATES.PLAYING);
    });

    it('should dispatch an event on transition', () => {
        const spy = vi.fn();
        window.addEventListener('gameStateChange', spy);
        
        gameState.transition(STATES.SETTINGS);
        
        expect(spy).toHaveBeenCalled();
        expect(spy.mock.calls[0][0].detail.current).toBe(STATES.SETTINGS);
    });
});
