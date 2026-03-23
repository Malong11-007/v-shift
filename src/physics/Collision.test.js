import { describe, it, expect, vi } from 'vitest';
import collision from './Collision.js';

describe('Collision', () => {
    it('should have a collider map', () => {
        expect(collision.colliderMap).toBeDefined();
        expect(collision.colliderMap instanceof Map).toBe(true);
    });

    it('should register and unregister colliders', () => {
        const mockCollider = { handle: 123 };
        const mockEntity = { id: 'test' };
        
        collision.colliderMap.set(mockCollider.handle, mockEntity);
        expect(collision.colliderMap.get(123)).toBe(mockEntity);
        
        collision.colliderMap.delete(123);
        expect(collision.colliderMap.has(123)).toBe(false);
    });

    it('should perform raycasting (mocked)', () => {
        // Since castRay depends on physics.world, we'd need to mock physics
        // For this test, we just check if the function exists and handles null world
        expect(collision.castRay).toBeDefined();
        const result = collision.castRay({x:0,y:0,z:0}, {x:0,y:0,z:1}, 10);
        expect(result).toBeNull(); // Should be null because physics.world is not init in test
    });
});
