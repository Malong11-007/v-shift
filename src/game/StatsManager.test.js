import { describe, it, expect, beforeEach, vi } from 'vitest';
import statsManager from './StatsManager.js';

describe('StatsManager', () => {
    beforeEach(() => {
        statsManager.reset();
        vi.restoreAllMocks();
    });

    it('should initialize with zero stats', () => {
        expect(statsManager.kills).toBe(0);
        expect(statsManager.headshotKills).toBe(0);
        expect(statsManager.knifeKills).toBe(0);
        expect(statsManager.maxBhopChain).toBe(0);
        expect(statsManager.shotsFired).toBe(0);
        expect(statsManager.shotsHit).toBe(0);
    });

    it('should track kills from playerKilled events for local player', () => {
        window.dispatchEvent(new CustomEvent('playerKilled', {
            detail: { killerIsLocal: true, isHeadshot: false, weaponId: 'V44SABRE' }
        }));
        expect(statsManager.kills).toBe(1);
        expect(statsManager.headshotKills).toBe(0);
    });

    it('should track headshot kills', () => {
        window.dispatchEvent(new CustomEvent('playerKilled', {
            detail: { killerIsLocal: true, isHeadshot: true, weaponId: 'V44SABRE' }
        }));
        expect(statsManager.kills).toBe(1);
        expect(statsManager.headshotKills).toBe(1);
    });

    it('should track knife kills', () => {
        window.dispatchEvent(new CustomEvent('playerKilled', {
            detail: { killerIsLocal: true, isHeadshot: false, weaponId: 'KNIFE' }
        }));
        expect(statsManager.knifeKills).toBe(1);
    });

    it('should not count kills from non-local players', () => {
        window.dispatchEvent(new CustomEvent('playerKilled', {
            detail: { killerIsLocal: false, isHeadshot: true, weaponId: 'V44SABRE' }
        }));
        expect(statsManager.kills).toBe(0);
    });

    it('should NOT count wall hits as accuracy hits', () => {
        window.dispatchEvent(new CustomEvent('hitMarker', {
            detail: { type: 'wall', damage: 0 }
        }));
        expect(statsManager.shotsHit).toBe(0);
    });

    it('should count body hits as accuracy hits', () => {
        window.dispatchEvent(new CustomEvent('hitMarker', {
            detail: { type: 'body', damage: 25 }
        }));
        expect(statsManager.shotsHit).toBe(1);
    });

    it('should count head hits as accuracy hits', () => {
        window.dispatchEvent(new CustomEvent('hitMarker', {
            detail: { type: 'head', damage: 88 }
        }));
        expect(statsManager.shotsHit).toBe(1);
    });

    it('should track shots fired from weaponFired events', () => {
        window.dispatchEvent(new CustomEvent('weaponFired'));
        window.dispatchEvent(new CustomEvent('weaponFired'));
        expect(statsManager.shotsFired).toBe(2);
    });

    it('should track max bhop chain', () => {
        window.dispatchEvent(new CustomEvent('onBhop', { detail: 3 }));
        expect(statsManager.maxBhopChain).toBe(3);

        window.dispatchEvent(new CustomEvent('onBhop', { detail: 2 }));
        expect(statsManager.maxBhopChain).toBe(3); // Should not decrease
    });

    it('should calculate MVP award for 5+ kills', () => {
        statsManager.kills = 5;
        const awards = statsManager.calculateAwards();
        expect(awards.some(a => a.title === 'MVP')).toBe(true);
    });

    it('should calculate Sharpshooter award for 40%+ headshot ratio', () => {
        statsManager.kills = 5;
        statsManager.headshotKills = 3; // 60%
        const awards = statsManager.calculateAwards();
        expect(awards.some(a => a.title === 'Sharpshooter')).toBe(true);
    });

    it('should not award Sharpshooter with too few kills', () => {
        statsManager.kills = 2;
        statsManager.headshotKills = 2; // 100% but only 2 kills
        const awards = statsManager.calculateAwards();
        expect(awards.some(a => a.title === 'Sharpshooter')).toBe(false);
    });

    it('should calculate Speed Demon award for bhop chain of 5+', () => {
        statsManager.maxBhopChain = 5;
        const awards = statsManager.calculateAwards();
        expect(awards.some(a => a.title === 'Speed Demon')).toBe(true);
    });

    it('should calculate Humiliator award for knife kills', () => {
        statsManager.knifeKills = 1;
        const awards = statsManager.calculateAwards();
        expect(awards.some(a => a.title === 'Humiliator')).toBe(true);
    });

    it('should calculate Trigger Happy for low accuracy with many shots', () => {
        statsManager.shotsFired = 200;
        statsManager.shotsHit = 10; // 5%
        const awards = statsManager.calculateAwards();
        expect(awards.some(a => a.title === 'Trigger Happy')).toBe(true);
    });

    it('should not give Trigger Happy for decent accuracy', () => {
        statsManager.shotsFired = 200;
        statsManager.shotsHit = 80; // 40%
        const awards = statsManager.calculateAwards();
        expect(awards.some(a => a.title === 'Trigger Happy')).toBe(false);
    });
});
