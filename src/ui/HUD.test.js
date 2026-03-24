import { describe, it, expect, beforeEach, vi } from 'vitest';
import hud from './HUD.js';

// Mock dependencies
import engine from '../core/Engine.js';
import matchManager from '../game/MatchManager.js';
import roundManager from '../game/RoundManager.js';

vi.mock('../core/Engine.js', () => ({
    default: {
        updatables: { push: vi.fn(), includes: vi.fn(() => false) },
        fps: 144
    }
}));
vi.mock('../core/GameState.js', () => ({ 
    STATES: { PLAYING: 'PLAYING' },
    default: { currentState: 'PLAYING' } 
}));
vi.mock('../game/MatchManager.js', () => ({ default: { currentMode: 'COMPETITIVE' } }));
vi.mock('../game/RoundManager.js', () => ({ default: { currentRound: 1, timer: 90, state: 'LIVE' } }));
vi.mock('./Radar.js', () => ({ default: { update: vi.fn() } }));

describe('HUD Integration', () => {
    let uiRoot;

    beforeEach(() => {
        // Ensure ui-root exists for specific features like hit markers
        let currentRoot = document.getElementById('ui-root');
        if (!currentRoot) {
            currentRoot = document.createElement('div');
            currentRoot.id = 'ui-root';
            document.body.appendChild(currentRoot);
        }
        uiRoot = currentRoot;

        // Since HUD is an ES module singleton, it mounts on import.
        // We must ensure its container remains in the DOM if other tests cleared it.
        if (!document.getElementById('hud-container')) {
            document.body.appendChild(hud.container);
        }
        
        // Reset localPlayer mock
        window.localPlayer = {
            health: 100,
            weaponSystem: {
                currentWeapon: { id: 'V44SABRE' },
                ammo: { 'V44SABRE': 30 }
            }
        };
    });

    it('should create necessary DOM elements on setup', () => {
        expect(document.getElementById('hud-container')).not.toBeNull();
        expect(document.getElementById('hud-health-value')).not.toBeNull();
        expect(document.getElementById('hud-ammo-value')).not.toBeNull();
    });

    it('should update health text when player takes damage', () => {
        window.localPlayer.health = 45;
        hud.update(window.localPlayer, 0.1); // Trigger update
        
        const healthEl = document.getElementById('hud-health-value');
        expect(String(healthEl.innerText)).toBe('45');
    });

    it('should update ammo text from active weapon', () => {
        // Need to dispatch an ammo event since HUD uses listeners for ammo
        window.dispatchEvent(new CustomEvent('weaponAmmoSync', { detail: { current: 12, max: 30 } }));
        
        const ammoEl = document.getElementById('hud-ammo-value');
        expect(ammoEl.innerText).toBe('12 / 30');
    });

    it('should process hitMarker events and render UI crosshair feedback', () => {
        // Dispatch hit event
        window.dispatchEvent(new CustomEvent('hitMarker', { detail: { type: 'body', damage: 25 } }));
        
        // hit marker should become visible
        expect(hud.hitMarker.style.opacity).toBe('1');
    });
});
