import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('./InputManager.js', () => ({
    default: {
        touchActive: false,
        touchMove: { x: 0, z: 0 },
        touchLook: { x: 0, y: 0 },
        touchCrouchHeld: false
    }
}));

vi.mock('./GameState.js', () => ({
    STATES: { PLAYING: 'PLAYING' },
    default: { currentState: 'PLAYING' }
}));

import input from './InputManager.js';
import touchControls from './TouchControls.js';

describe('TouchControls', () => {
    beforeEach(() => {
        input.touchActive = false;
        input.touchMove = { x: 0, z: 0 };
        input.touchLook = { x: 0, y: 0 };
        input.touchCrouchHeld = false;
    });

    it('should export a singleton', () => {
        expect(touchControls).toBeDefined();
        expect(typeof touchControls.show).toBe('function');
        expect(typeof touchControls.hide).toBe('function');
    });

    it('should detect touch device capability', () => {
        expect(typeof touchControls.isTouchDevice).toBe('boolean');
    });

    it('should set touchActive when shown', () => {
        // If not a touch device, container is null; skip
        if (!touchControls.container) return;

        touchControls.show();
        expect(input.touchActive).toBe(true);
        expect(touchControls.active).toBe(true);
    });

    it('should reset state when hidden', () => {
        if (!touchControls.container) return;

        touchControls.show();
        input.touchMove = { x: 0.5, z: 0.3 };
        touchControls.hide();

        expect(input.touchActive).toBe(false);
        expect(touchControls.active).toBe(false);
        expect(input.touchMove.x).toBe(0);
        expect(input.touchMove.z).toBe(0);
    });

    it('should normalize joystick input within radius', () => {
        if (!touchControls.container) return;

        touchControls.show();
        // Simulate joystick origin at center of base
        touchControls.joyOrigin = { x: 100, y: 100 };
        touchControls.updateJoystick(150, 100); // 50px right

        expect(input.touchMove.x).toBe(1); // 50/50 = 1 (max)
        expect(input.touchMove.z).toBe(0);
    });

    it('should clamp joystick to maximum radius', () => {
        if (!touchControls.container) return;

        touchControls.show();
        touchControls.joyOrigin = { x: 100, y: 100 };
        touchControls.updateJoystick(300, 100); // 200px right (way beyond radius)

        expect(input.touchMove.x).toBe(1); // Clamped to max
        expect(input.touchMove.z).toBe(0);
    });

    it('should reset joystick to zero on release', () => {
        if (!touchControls.container) return;

        touchControls.show();
        input.touchMove = { x: 0.8, z: -0.5 };
        touchControls.resetJoystick();

        expect(input.touchMove.x).toBe(0);
        expect(input.touchMove.z).toBe(0);
        expect(touchControls.joyTouchId).toBeNull();
    });
});
