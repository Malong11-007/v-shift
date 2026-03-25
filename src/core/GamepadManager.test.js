import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('./InputManager.js', () => ({
    default: {
        gamepadActive: false,
        gamepadMove: { x: 0, z: 0 },
        gamepadLook: { x: 0, y: 0 },
        gamepadCrouchHeld: false
    }
}));

vi.mock('./GameState.js', () => ({
    STATES: { PLAYING: 'PLAYING', PAUSED: 'PAUSED' },
    default: { currentState: 'PLAYING', transition: vi.fn() }
}));

import input from './InputManager.js';
import GamepadManager from './GamepadManager.js';

describe('GamepadManager', () => {
    let gpm;

    beforeEach(() => {
        input.gamepadActive = false;
        input.gamepadMove = { x: 0, z: 0 };
        input.gamepadLook = { x: 0, y: 0 };
        input.gamepadCrouchHeld = false;
        gpm = GamepadManager;

        // jsdom doesn't provide getGamepads; define it so we can mock it
        if (!navigator.getGamepads) {
            Object.defineProperty(navigator, 'getGamepads', {
                value: () => [],
                writable: true,
                configurable: true
            });
        }
    });

    it('should export a singleton with an update method', () => {
        expect(typeof gpm.update).toBe('function');
    });

    it('should have a deadzone property', () => {
        expect(gpm.deadzone).toBe(0.15);
    });

    it('should apply deadzone correctly', () => {
        expect(gpm.applyDeadzone(0.1)).toBe(0);
        expect(gpm.applyDeadzone(0)).toBe(0);
        expect(gpm.applyDeadzone(-0.1)).toBe(0);
        // Above deadzone should return non-zero
        const result = gpm.applyDeadzone(0.5);
        expect(result).toBeGreaterThan(0);
        expect(result).toBeLessThanOrEqual(1);
    });

    it('should clear gamepad state when no gamepad found', () => {
        input.gamepadActive = true;
        input.gamepadMove = { x: 0.5, z: 0.3 };

        // navigator.getGamepads returns empty array
        vi.spyOn(navigator, 'getGamepads').mockReturnValue([]);
        gpm.update(0.016);

        expect(input.gamepadActive).toBe(false);
        expect(input.gamepadMove.x).toBe(0);
        expect(input.gamepadMove.z).toBe(0);
    });

    it('should dispatch onJump when A button is just pressed', () => {
        const spy = vi.spyOn(window, 'dispatchEvent');
        const mockButtons = new Array(17).fill(null).map(() => ({ pressed: false }));
        mockButtons[0] = { pressed: true }; // A button

        vi.spyOn(navigator, 'getGamepads').mockReturnValue([{
            connected: true,
            axes: [0, 0, 0, 0],
            buttons: mockButtons
        }]);

        gpm.prevButtons.fill(false);
        gpm.update(0.016);

        const jumpEvent = spy.mock.calls.find(c => c[0].type === 'onJump');
        expect(jumpEvent).toBeDefined();
    });

    it('should set gamepadActive when a gamepad is found', () => {
        const mockButtons = new Array(17).fill(null).map(() => ({ pressed: false }));
        vi.spyOn(navigator, 'getGamepads').mockReturnValue([{
            connected: true,
            axes: [0.5, -0.3, 0, 0],
            buttons: mockButtons
        }]);

        gpm.prevButtons.fill(false);
        gpm.update(0.016);

        expect(input.gamepadActive).toBe(true);
        expect(input.gamepadMove.x).toBeGreaterThan(0);
    });

    it('should accumulate right stick look delta', () => {
        const mockButtons = new Array(17).fill(null).map(() => ({ pressed: false }));
        vi.spyOn(navigator, 'getGamepads').mockReturnValue([{
            connected: true,
            axes: [0, 0, 0.8, -0.5],
            buttons: mockButtons
        }]);

        input.gamepadLook = { x: 0, y: 0 };
        gpm.prevButtons.fill(false);
        gpm.update(0.016);

        expect(input.gamepadLook.x).toBeGreaterThan(0);
        expect(input.gamepadLook.y).toBeLessThan(0);
    });

    it('should track crouch held state from B button', () => {
        const mockButtons = new Array(17).fill(null).map(() => ({ pressed: false }));
        mockButtons[1] = { pressed: true }; // B button
        vi.spyOn(navigator, 'getGamepads').mockReturnValue([{
            connected: true,
            axes: [0, 0, 0, 0],
            buttons: mockButtons
        }]);

        gpm.prevButtons.fill(false);
        gpm.update(0.016);

        expect(input.gamepadCrouchHeld).toBe(true);
    });
});
