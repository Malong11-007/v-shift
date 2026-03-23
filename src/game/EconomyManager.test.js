import { describe, it, expect, beforeEach, vi } from 'vitest';
import economyManager from './EconomyManager.js';

describe('EconomyManager', () => {
    beforeEach(() => {
        // Reset singleton state before each test
        economyManager.reset();
        // Clear any mocks
        vi.restoreAllMocks();
    });

    it('should initialize with starting cash of 800', () => {
        expect(economyManager.cash).toBe(800);
        expect(economyManager.lossStreak).toBe(0);
    });

    it('should add cash and cap at maxCash', () => {
        economyManager.addCash(1000);
        expect(economyManager.cash).toBe(1800);

        economyManager.addCash(10000);
        expect(economyManager.cash).toBe(9000); // Max cash
    });

    it('should dispatch cashChanged event when cash is added', () => {
        const spy = vi.spyOn(window, 'dispatchEvent');
        economyManager.addCash(500, 'Test Bonus');
        
        expect(spy).toHaveBeenCalled();
        const eventArgs = spy.mock.calls[0][0];
        expect(eventArgs.type).toBe('cashChanged');
        expect(eventArgs.detail).toEqual({ cash: 1300, delta: 500, reason: 'Test Bonus' });
    });

    it('should allow spending cash if sufficient funds exist', () => {
        const success = economyManager.spendCash(500);
        expect(success).toBe(true);
        expect(economyManager.cash).toBe(300);
    });

    it('should reject spending cash if insufficient funds exist', () => {
        economyManager.cash = 400;
        const success = economyManager.spendCash(500);
        expect(success).toBe(false);
        expect(economyManager.cash).toBe(400); // Unchanged
    });

    it('should handle playerKilled event and award cash', () => {
        const spy = vi.spyOn(economyManager, 'addCash');
        economyManager.handleKill({
            detail: { reward: 600, isHeadshot: true, isFirstBlood: true }
        });
        
        expect(spy).toHaveBeenCalledWith(600, 'Enemy Killed');
        expect(spy).toHaveBeenCalledWith(200, 'First Blood');
        expect(spy).toHaveBeenCalledWith(100, 'Headshot Bonus');
        // 800 + 600 + 200 + 100 = 1700
        expect(economyManager.cash).toBe(1700);
    });

    it('should handle round win and reset loss streak', () => {
        economyManager.lossStreak = 2;
        economyManager.handleRoundEnd({ detail: { winner: 'ATTACKERS' } }); // Assuming won condition
        
        expect(economyManager.lossStreak).toBe(0);
        expect(economyManager.cash).toBe(800 + 3000);
    });

    it('should handle round loss and increment loss streak bonus', () => {
        // First loss: 1400 + 0 = 1400
        economyManager.handleRoundEnd({ detail: { winner: 'DEFENDERS' } }); 
        expect(economyManager.lossStreak).toBe(1);
        expect(economyManager.cash).toBe(800 + 1400);

        // Second loss: 1400 + 500 = 1900
        economyManager.handleRoundEnd({ detail: { winner: 'DEFENDERS' } }); 
        expect(economyManager.lossStreak).toBe(2);
        expect(economyManager.cash).toBe(800 + 1400 + 1900);
        
        // Ensure cap at 2900 max bonus
        economyManager.lossStreak = 5;
        economyManager.cash = 0; // reset to check exact addition
        economyManager.handleRoundEnd({ detail: { winner: 'DEFENDERS' } }); 
        expect(economyManager.lossStreak).toBe(6);
        expect(economyManager.cash).toBe(1400 + 1500); // 2900
    });
});
