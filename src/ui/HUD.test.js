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

    it('should render surge meter updates', () => {
        window.dispatchEvent(new CustomEvent('momentumSurgeUpdate', { detail: { active: true, remaining: 3, duration: 4, multiplier: 1.3 } }));
        
        const surge = document.getElementById('hud-surge');
        const fill = document.getElementById('hud-surge-fill');
        const label = document.getElementById('hud-surge-label');

        expect(surge.style.display).toBe('flex');
        expect(label.innerText).toContain('x1.30');
        expect(parseFloat(fill.style.width)).toBeGreaterThan(0);

        window.dispatchEvent(new CustomEvent('momentumSurgeExpired'));
        expect(surge.style.display).toBe('none');
    });

    it('should show scope overlay when scopeChanged event fires with scoped=true', () => {
        window.dispatchEvent(new CustomEvent('scopeChanged', { detail: { scoped: true } }));
        
        const overlay = document.getElementById('scope-overlay');
        expect(overlay).not.toBeNull();
        expect(overlay.style.display).toBe('block');
        // Default crosshair should be hidden
        expect(hud.crosshair.style.display).toBe('none');
    });

    it('should hide scope overlay when scopeChanged event fires with scoped=false', () => {
        window.dispatchEvent(new CustomEvent('scopeChanged', { detail: { scoped: true } }));
        window.dispatchEvent(new CustomEvent('scopeChanged', { detail: { scoped: false } }));
        
        const overlay = document.getElementById('scope-overlay');
        expect(overlay.style.display).toBe('none');
        expect(hud.crosshair.style.display).toBe('block');
    });
});
