import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import input from '../core/InputManager.js';
import audioManager from '../core/AudioManager.js';

vi.mock('../core/InputManager.js', () => ({
    default: {
        isKeyDown: vi.fn(),
        getMouseDelta: vi.fn(),
        isLocked: true
    }
}));

vi.mock('../core/AudioManager.js', () => ({
    default: {
        playSyntheticSfx: vi.fn()
    }
}));

import KineticEngine from './KineticEngine.js';

describe('KineticEngine', () => {
    let mockBody;
    let mockCamera;
    let kineticEngine;

    beforeEach(() => {
        // Mock simple RigidBody wrapper
        let _linvel = { x: 0, y: 0, z: 0 };
        mockBody = {
            linvel: vi.fn(() => _linvel),
            setLinvel: vi.fn((vel) => { _linvel = vel; })
        };

        // Mock camera
        mockCamera = new THREE.Camera();
        
        // Setup engine
        kineticEngine = new KineticEngine(mockBody, mockCamera);

        // Mocks
        vi.spyOn(audioManager, 'playSyntheticSfx').mockImplementation(() => {});
        vi.spyOn(input, 'isKeyDown').mockReturnValue(false);
    });

    it('should initialize correctly', () => {
        expect(kineticEngine.isGrounded).toBe(false);
        expect(kineticEngine.consecutiveJumps).toBe(0);
        expect(kineticEngine.maxSpeed).toBe(12.0);
    });

    it('should track grounding state and combo window', () => {
        // Land
        kineticEngine.setGrounded(true);
        expect(kineticEngine.isGrounded).toBe(true);
        expect(kineticEngine.lastGroundedTime).toBeGreaterThan(0);

        // Wait past bhop window (simulate 1 second delay)
        const oldTime = performance.now() / 1000 - 1.0;
        kineticEngine.lastGroundedTime = oldTime;
        kineticEngine.consecutiveJumps = 3;
        
        // Call setGrounded(true) again to trigger combo check
        kineticEngine.setGrounded(true);
        expect(kineticEngine.consecutiveJumps).toBe(0); // Combo broken
    });

    it('should handle regular jump', () => {
        kineticEngine.setGrounded(true);
        kineticEngine.handleJump();

        expect(mockBody.setLinvel).toHaveBeenCalledWith(expect.objectContaining({ y: 12.0 }), true);
        expect(audioManager.playSyntheticSfx).toHaveBeenCalledWith('jump');
        expect(kineticEngine.isGrounded).toBe(false);
    });

    it('should increment b-hop chain if jumping immediately after landing', () => {
        const eventSpy = vi.spyOn(window, 'dispatchEvent');
        
        // Land
        kineticEngine.setGrounded(true);
        const oldTime = performance.now() / 1000;
        kineticEngine.lastGroundedTime = oldTime;
        
        // Jump within window
        kineticEngine.handleJump();

        expect(kineticEngine.consecutiveJumps).toBe(1);
        expect(audioManager.playSyntheticSfx).toHaveBeenCalledWith('bhop_success');
        
        // Verify speed boost applied
        expect(mockBody.setLinvel).toHaveBeenCalled();
        const eventCall = eventSpy.mock.calls.find(call => call[0].type === 'onBhop');
        expect(eventCall).toBeDefined();
    });

    it('should ignore jump if airborne for too long', () => {
        kineticEngine.setGrounded(false);
        kineticEngine.lastGroundedTime = (performance.now() / 1000) - 1.0; // 1s ago
        
        vi.clearAllMocks();
        kineticEngine.handleJump();
        
        // Should not jump
        expect(mockBody.setLinvel).not.toHaveBeenCalled();
    });

    it('should apply friction when grounded and not moving', () => {
        kineticEngine.setGrounded(true);
        // Set some starting velocity
        mockBody.setLinvel({ x: 10, y: 0, z: 0 }, true);
        
        kineticEngine.update(0.05); // 50ms to ensure partial deceleration
        
        // Speed should be reduced by friction
        const finalVel = mockBody.linvel();
        expect(finalVel.x).toBeLessThan(10);
        expect(finalVel.x).toBeGreaterThan(0);
    });

    it('should dispatch playerSpeedUpdate event', () => {
        const spy = vi.spyOn(window, 'dispatchEvent');
        kineticEngine.update(0.1);
        
        const speedEvent = spy.mock.calls.find(call => call[0].type === 'playerSpeedUpdate');
        expect(speedEvent).toBeDefined();
        expect(speedEvent[0].detail.speed).toBeDefined();
    });
});
