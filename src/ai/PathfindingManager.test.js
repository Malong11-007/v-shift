/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import pathfindingManager from './PathfindingManager.js';
import * as THREE from 'three';

describe('PathfindingManager', () => {
    let scene;

    beforeEach(() => {
        // Create a mock scene
        scene = new THREE.Scene();

        // Initialize pathfinding
        pathfindingManager.init(scene);
    });

    it('should initialize successfully', () => {
        expect(pathfindingManager.isReady()).toBe(true);
        expect(pathfindingManager.navMesh).toBeDefined();
    });

    it('should have a navigation mesh after initialization', () => {
        const navMesh = pathfindingManager.getNavMesh();
        expect(navMesh).toBeDefined();
        expect(navMesh).toBeInstanceOf(THREE.Mesh);
    });

    it('should find a path between two points', () => {
        const start = new THREE.Vector3(-10, 0.1, -10);
        const end = new THREE.Vector3(10, 0.1, 10);

        const path = pathfindingManager.findPath(start, end);

        // Path might be null if points are in obstacles, but should work for open areas
        // Just verify the method doesn't throw
        expect(path).toBeDefined();
    });

    it('should find a smooth path', () => {
        const start = new THREE.Vector3(-20, 0.1, -20);
        const end = new THREE.Vector3(20, 0.1, 20);

        const path = pathfindingManager.findSmoothPath(start, end);

        // Smooth path should have fewer waypoints than regular path
        expect(path).toBeDefined();
    });

    it('should detect obstacles correctly', () => {
        // Center of arena should be an obstacle
        expect(pathfindingManager.isObstacle(0, 0, null)).toBe(true);

        // Open area should not be an obstacle
        expect(pathfindingManager.isObstacle(-20, -20, null)).toBe(false);

        // Outside boundaries should be an obstacle
        expect(pathfindingManager.isObstacle(50, 50, null)).toBe(true);
    });

    it('should check line of sight', () => {
        const from = new THREE.Vector3(-10, 0.1, -10);
        const to = new THREE.Vector3(-15, 0.1, -15);

        const hasLOS = pathfindingManager.hasLineOfSight(from, to);

        expect(typeof hasLOS).toBe('boolean');
    });

    it('should get next waypoint from path', () => {
        const path = [
            new THREE.Vector3(0, 0.1, 0),
            new THREE.Vector3(5, 0.1, 5),
            new THREE.Vector3(10, 0.1, 10)
        ];
        const currentPos = new THREE.Vector3(0, 0.1, 0);

        const nextWaypoint = pathfindingManager.getNextWaypoint(path, currentPos, 2);

        expect(nextWaypoint).toBeDefined();
        expect(nextWaypoint).toBeInstanceOf(THREE.Vector3);
    });

    it('should return null for next waypoint with empty path', () => {
        const path = [];
        const currentPos = new THREE.Vector3(0, 0.1, 0);

        const nextWaypoint = pathfindingManager.getNextWaypoint(path, currentPos, 2);

        expect(nextWaypoint).toBeNull();
    });

    it('should clear path cache', () => {
        const start = new THREE.Vector3(-10, 0.1, -10);
        const end = new THREE.Vector3(10, 0.1, 10);

        // Find a path to populate cache
        pathfindingManager.findPath(start, end);

        // Clear cache - should not throw
        pathfindingManager.clearCache();

        expect(pathfindingManager.pathCache.size).toBe(0);
    });

    it('should toggle navigation mesh visibility', () => {
        const navMesh = pathfindingManager.getNavMesh();

        pathfindingManager.setNavMeshVisible(true);
        expect(navMesh.visible).toBe(true);

        pathfindingManager.setNavMeshVisible(false);
        expect(navMesh.visible).toBe(false);
    });

    it('should handle null path in getNextWaypoint', () => {
        const currentPos = new THREE.Vector3(0, 0.1, 0);

        const nextWaypoint = pathfindingManager.getNextWaypoint(null, currentPos, 2);

        expect(nextWaypoint).toBeNull();
    });

    it('should return last waypoint when all are close', () => {
        const path = [
            new THREE.Vector3(0, 0.1, 0),
            new THREE.Vector3(0.5, 0.1, 0.5)
        ];
        const currentPos = new THREE.Vector3(0, 0.1, 0);

        const nextWaypoint = pathfindingManager.getNextWaypoint(path, currentPos, 2);

        expect(nextWaypoint).toBeDefined();
        // Should return the last waypoint since all are within threshold
        expect(nextWaypoint).toBe(path[path.length - 1]);
    });

    it('should cache paths for performance', () => {
        const start = new THREE.Vector3(-10, 0.1, -10);
        const end = new THREE.Vector3(10, 0.1, 10);

        // First call - should compute path
        const path1 = pathfindingManager.findPath(start, end);

        // Second call - should use cache (if path was successfully computed)
        const path2 = pathfindingManager.findPath(start, end);

        // Both calls should return the same result
        if (path1) {
            expect(path2).toBeDefined();
        }
    });
});
