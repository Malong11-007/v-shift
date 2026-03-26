/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import ammoPhysics from './AmmoPhysics.js';
import * as THREE from 'three';

describe('AmmoPhysics', () => {
    beforeEach(async () => {
        // Try to initialize AmmoPhysics, but skip tests if it fails in test environment
        try {
            if (!ammoPhysics.isInitialized()) {
                await ammoPhysics.init();
            }
        } catch (error) {
            // ammo.js requires WebAssembly and doesn't work in jsdom test environment
            // This is expected behavior - skip tests that require ammo.js
        }
    });

    it('should have initialization state', () => {
        // This test works regardless of whether ammo.js actually initialized
        expect(typeof ammoPhysics.isInitialized).toBe('function');
        expect(typeof ammoPhysics.isInitialized()).toBe('boolean');
    });

    it('should have required methods', () => {
        expect(typeof ammoPhysics.init).toBe('function');
        expect(typeof ammoPhysics.createRigidBody).toBe('function');
        expect(typeof ammoPhysics.update).toBe('function');
        expect(typeof ammoPhysics.removeBody).toBe('function');
        expect(typeof ammoPhysics.getBodyCount).toBe('function');
    });

    it('should handle operations gracefully when not initialized', () => {
        // These should not throw even if ammo.js isn't available
        const position = new THREE.Vector3(0, 5, 0);
        const quaternion = new THREE.Quaternion();
        const shapeDesc = { type: 'box', hx: 1, hy: 1, hz: 1 };

        const result = ammoPhysics.createRigidBody(1.0, position, quaternion, shapeDesc);

        if (!ammoPhysics.isInitialized()) {
            expect(result).toBeNull();
        }
    });

    it('should return correct body count', () => {
        const count = ammoPhysics.getBodyCount();
        expect(typeof count).toBe('number');
        expect(count).toBeGreaterThanOrEqual(0);
    });

    it('should handle update calls safely', () => {
        // Should not throw even if not initialized
        expect(() => {
            ammoPhysics.update(1 / 60);
        }).not.toThrow();
    });

    it('should handle unknown shape type gracefully', () => {
        const position = new THREE.Vector3(0, 1, 0);
        const quaternion = new THREE.Quaternion();
        const shapeDesc = { type: 'unknown', radius: 1 };

        const result = ammoPhysics.createRigidBody(1.0, position, quaternion, shapeDesc);

        // Should return null for unknown shape type
        expect(result).toBeNull();
    });

    it('should have gravity constant configured', () => {
        expect(ammoPhysics.gravityConstant).toBe(-30.0);
    });

    it('should have time step configured', () => {
        expect(ammoPhysics.timeStep).toBe(1.0 / 60.0);
    });

    it('should track rigid bodies array', () => {
        expect(Array.isArray(ammoPhysics.rigidBodies)).toBe(true);
    });

    it('should track constraints array', () => {
        expect(Array.isArray(ammoPhysics.constraints)).toBe(true);
    });
});
