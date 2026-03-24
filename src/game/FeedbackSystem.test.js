import { describe, it, expect, beforeEach, vi } from 'vitest';
import audioManager from '../core/AudioManager.js';

vi.mock('../core/AudioManager.js', () => ({
    default: {
        playSyntheticSfx: vi.fn()
    }
}));

import feedbackSystem from './FeedbackSystem.js';

describe('FeedbackSystem', () => {
    let uiRoot;
    let appRoot;

    beforeEach(() => {
        // Setup JSDOM mocks
        document.body.innerHTML = `
            <div id="app"></div>
            <div id="ui-root"></div>
        `;
        uiRoot = document.getElementById('ui-root');
        appRoot = document.getElementById('app');
        
        // Mock audio manager
        vi.spyOn(audioManager, 'playSyntheticSfx').mockImplementation(() => {});
        
        // Reset feedback state
        feedbackSystem.recentKills = [];
    });

    it('should show hit marker and play headshot sound', () => {
        const flashSpy = vi.spyOn(feedbackSystem, 'screenFlash');
        window.dispatchEvent(new CustomEvent('hitMarker', { detail: { type: 'head', damage: 100 } }));

        expect(audioManager.playSyntheticSfx).toHaveBeenCalledWith('headshot_snap');
        expect(flashSpy).toHaveBeenCalledWith('white');
    });

    it('should play body hit sound', () => {
        window.dispatchEvent(new CustomEvent('hitMarker', { detail: { type: 'body', damage: 25 } }));
        expect(audioManager.playSyntheticSfx).toHaveBeenCalledWith('hit');
    });

    it('should ignore wall hits for audio', () => {
        vi.clearAllMocks();
        window.dispatchEvent(new CustomEvent('hitMarker', { detail: { type: 'wall', damage: 0 } }));
        expect(audioManager.playSyntheticSfx).not.toHaveBeenCalled();
    });

    it('should track multi-kills and announce them', () => {
        const announceSpy = vi.spyOn(feedbackSystem, 'announceMultiKill');
        
        // Simulate two fast kills
        window.dispatchEvent(new CustomEvent('playerKilled', { detail: { killerIsLocal: true } }));
        window.dispatchEvent(new CustomEvent('playerKilled', { detail: { killerIsLocal: true } }));
        
        expect(feedbackSystem.recentKills.length).toBe(2);
        expect(announceSpy).toHaveBeenLastCalledWith(2);
    });

    it('should prune old multi-kills', () => {
        // Manually push an old timestamp (4 seconds ago)
        feedbackSystem.recentKills.push(performance.now() - 4000);
        
        // Simulate new kill
        window.dispatchEvent(new CustomEvent('playerKilled', { detail: { killerIsLocal: true } }));
        
        // Only the new kill should remain
        expect(feedbackSystem.recentKills.length).toBe(1);
    });

    it('should append label to DOM when showLabel is called', () => {
        feedbackSystem.showLabel('TEST LABEL', '#ffffff', 40);
        
        const labels = uiRoot.querySelectorAll('div');
        expect(labels.length).toBe(1);
        expect(labels[0].innerText).toBe('TEST LABEL');
        expect(labels[0].style.fontSize).toBe('40px');
    });

    it('should trigger screen shake on headshot kill', () => {
        const shakeSpy = vi.spyOn(feedbackSystem, 'screenShake');
        window.dispatchEvent(new CustomEvent('playerKilled', { 
            detail: { killerIsLocal: true, isHeadshot: true } 
        }));
        expect(shakeSpy).toHaveBeenCalledWith(5);
    });

    it('should show slide kill and airshot rewards', () => {
        const labelSpy = vi.spyOn(feedbackSystem, 'showLabel');
        
        window.dispatchEvent(new CustomEvent('playerKilled', { 
            detail: { killerIsLocal: true, killerSliding: true } 
        }));
        expect(labelSpy).toHaveBeenCalledWith('SLIDE KILL', '#00f0ff', 40, 200);

        window.dispatchEvent(new CustomEvent('playerKilled', { 
            detail: { killerIsLocal: true, killerAirborne: true } 
        }));
        expect(labelSpy).toHaveBeenCalledWith('AIRSHOT', '#ff00ff', 40, -200);
    });

    it('should not crash screenFlash when ui-root is missing', () => {
        // Remove ui-root from DOM
        const root = document.getElementById('ui-root');
        if (root) root.remove();

        // Should not throw
        expect(() => feedbackSystem.screenFlash('white', 100)).not.toThrow();
    });

    it('should create flash overlay when ui-root exists', () => {
        feedbackSystem.screenFlash('red', 100);
        const flashElements = uiRoot.querySelectorAll('div');
        expect(flashElements.length).toBeGreaterThanOrEqual(1);
    });

    it('should show bhop chain label for 3+ chain', () => {
        const labelSpy = vi.spyOn(feedbackSystem, 'showLabel');
        window.dispatchEvent(new CustomEvent('playerKilled', {
            detail: { killerIsLocal: true, bhopChain: 3 }
        }));
        expect(labelSpy).toHaveBeenCalledWith(expect.stringContaining('x3 PERFECT CHAIN'), '#00ffaa', 30, 0, 150);
    });

    it('should show speed demon text for 5+ bhop chain', () => {
        const labelSpy = vi.spyOn(feedbackSystem, 'showLabel');
        window.dispatchEvent(new CustomEvent('playerKilled', {
            detail: { killerIsLocal: true, bhopChain: 5 }
        }));
        expect(labelSpy).toHaveBeenCalledWith(expect.stringContaining('SPEED DEMON'), '#00ffaa', 30, 0, 150);
    });
});
