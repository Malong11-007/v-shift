import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('./Engine.js', () => ({
    default: {
        getCanvas: vi.fn(() => document.createElement('canvas'))
    }
}));

vi.mock('./GameState.js', () => ({
    STATES: { PLAYING: 'PLAYING', PAUSED: 'PAUSED' },
    default: { currentState: 'PLAYING' }
}));

import input from './InputManager.js';

describe('InputManager', () => {
    beforeEach(() => {
        input.keys.clear();
        input.mouseDelta = { x: 0, y: 0 };
        input.gamepadActive = false;
        input.gamepadMove = { x: 0, z: 0 };
        input.gamepadLook = { x: 0, y: 0 };
        input.gamepadCrouchHeld = false;
        input.touchActive = false;
        input.touchMove = { x: 0, z: 0 };
        input.touchLook = { x: 0, y: 0 };
        input.touchCrouchHeld = false;
        input.isLocked = false;
    });

    describe('getMovementAxes', () => {
        it('should return zero when no input is active', () => {
            const axes = input.getMovementAxes();
            expect(axes.x).toBe(0);
            expect(axes.z).toBe(0);
        });

        it('should return keyboard input', () => {
            input.keys.set('KeyW', true);
            const axes = input.getMovementAxes();
            expect(axes.z).toBe(-1);
            expect(axes.x).toBe(0);
        });

        it('should combine keyboard and gamepad input', () => {
            input.keys.set('KeyD', true);
            input.gamepadMove.x = 0.5;
            const axes = input.getMovementAxes();
            // 1 + 0.5 = 1.5, clamped to unit circle
            expect(axes.x).toBeGreaterThan(0);
            expect(axes.x).toBeLessThanOrEqual(1);
        });

        it('should include touch joystick input', () => {
            input.touchMove.x = 0.7;
            input.touchMove.z = -0.3;
            const axes = input.getMovementAxes();
            expect(axes.x).toBeCloseTo(0.7, 1);
            expect(axes.z).toBeCloseTo(-0.3, 1);
        });

        it('should clamp combined input to unit circle', () => {
            input.keys.set('KeyW', true);
            input.keys.set('KeyA', true);
            input.gamepadMove.x = -1;
            input.gamepadMove.z = -1;
            const axes = input.getMovementAxes();
            const len = Math.sqrt(axes.x * axes.x + axes.z * axes.z);
            expect(len).toBeLessThanOrEqual(1.001);
        });
    });

    describe('getMouseDelta', () => {
        it('should combine mouse, gamepad look, and touch look', () => {
            input.mouseDelta = { x: 10, y: 5 };
            input.gamepadLook = { x: 3, y: 2 };
            input.touchLook = { x: 1, y: 1 };
            const delta = input.getMouseDelta();
            expect(delta.x).toBe(14);
            expect(delta.y).toBe(8);
        });

        it('should reset all accumulators after read', () => {
            input.mouseDelta = { x: 10, y: 5 };
            input.gamepadLook = { x: 3, y: 2 };
            input.touchLook = { x: 1, y: 1 };
            input.getMouseDelta();
            const delta2 = input.getMouseDelta();
            expect(delta2.x).toBe(0);
            expect(delta2.y).toBe(0);
        });
    });

    describe('isInputActive', () => {
        it('should return false when nothing is active', () => {
            expect(input.isInputActive()).toBe(false);
        });

        it('should return true when pointer is locked', () => {
            input.isLocked = true;
            expect(input.isInputActive()).toBe(true);
        });

        it('should return true when gamepad is active', () => {
            input.gamepadActive = true;
            expect(input.isInputActive()).toBe(true);
        });

        it('should return true when touch is active', () => {
            input.touchActive = true;
            expect(input.isInputActive()).toBe(true);
        });
    });

    describe('isCrouching', () => {
        it('should return true for KeyC', () => {
            input.keys.set('KeyC', true);
            expect(input.isCrouching()).toBe(true);
        });

        it('should return true for ControlLeft', () => {
            input.keys.set('ControlLeft', true);
            expect(input.isCrouching()).toBe(true);
        });

        it('should return true for gamepad crouch', () => {
            input.gamepadCrouchHeld = true;
            expect(input.isCrouching()).toBe(true);
        });

        it('should return true for touch crouch', () => {
            input.touchCrouchHeld = true;
            expect(input.isCrouching()).toBe(true);
        });

        it('should return false when nothing is pressed', () => {
            expect(input.isCrouching()).toBe(false);
        });
    });
});
