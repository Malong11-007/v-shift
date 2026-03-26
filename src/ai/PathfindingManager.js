/**
 * PathfindingManager - Navigation mesh system using three-pathfinding
 *
 * This module provides intelligent pathfinding for bots using navigation meshes.
 * It replaces simple direct-line navigation with proper obstacle avoidance.
 */

import * as THREE from 'three';
import { Pathfinding } from 'three-pathfinding';

class PathfindingManager {
    constructor() {
        this.pathfinding = new Pathfinding();
        this.navMesh = null;
        this.navMeshGroup = null;
        this.zoneId = 'arena';
        this.initialized = false;

        // Path caching for performance
        this.pathCache = new Map();
        this.cacheTimeout = 1000; // Cache paths for 1 second
    }

    /**
     * Initialize the pathfinding system with arena geometry
     * @param {THREE.Scene} scene - Three.js scene
     * @param {Array} staticGeometry - Array of arena collision boxes {x, y, z, hx, hy, hz}
     */
    init(scene, staticGeometry = null) {
        if (this.initialized) return;

        // Create a simple navigation mesh for the arena
        // In a production system, this would be generated from level geometry
        this.navMesh = this.createArenaNavMesh(staticGeometry);

        // Set up the pathfinding zone
        this.pathfinding.setZoneData(this.zoneId, Pathfinding.createZone(this.navMesh.geometry));

        // Store nav mesh group for debugging visualization
        this.navMeshGroup = this.navMesh;

        this.initialized = true;
        console.log('PathfindingManager initialized with arena navigation mesh');
    }

    /**
     * Create a navigation mesh for the arena
     * Based on the arena layout from Arena.js
     * @param {Array} staticGeometry - Optional array of obstacles
     * @returns {THREE.Mesh}
     */
    createArenaNavMesh(staticGeometry) {
        // Create a simplified walkable surface for the arena
        // The arena is 100x100 with various obstacles

        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const indices = [];

        // Define walkable zones as a grid
        // Arena bounds: -50 to 50 in X and Z, ground level at y=0.1
        const gridSize = 5; // 5 unit grid cells
        const minX = -45, maxX = 45;
        const minZ = -45, maxZ = 45;
        const y = 0.1; // Slightly above ground

        // Create a grid of triangles for navigation
        let vertexIndex = 0;
        for (let x = minX; x < maxX; x += gridSize) {
            for (let z = minZ; z < maxZ; z += gridSize) {
                // Skip areas with obstacles (simplified - would need proper collision checking)
                if (this.isObstacle(x, z, staticGeometry)) continue;

                // Create quad (2 triangles) for this grid cell
                const v0 = [x, y, z];
                const v1 = [x + gridSize, y, z];
                const v2 = [x + gridSize, y, z + gridSize];
                const v3 = [x, y, z + gridSize];

                vertices.push(...v0, ...v1, ...v2, ...v3);

                // Triangle 1
                indices.push(vertexIndex, vertexIndex + 1, vertexIndex + 2);
                // Triangle 2
                indices.push(vertexIndex, vertexIndex + 2, vertexIndex + 3);

                vertexIndex += 4;
            }
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();

        const material = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            wireframe: true,
            transparent: true,
            opacity: 0.3
        });

        return new THREE.Mesh(geometry, material);
    }

    /**
     * Check if a position is an obstacle (simplified)
     * @param {number} x - X coordinate
     * @param {number} z - Z coordinate
     * @param {Array} staticGeometry - Array of obstacles
     * @returns {boolean}
     */
    isObstacle(x, z, staticGeometry) {
        // Simplified obstacle detection
        // In the arena, major obstacles are:
        // - Center block at (0, 0)
        // - Outer walls at boundaries
        // - Various cover blocks

        // Check outer walls
        if (Math.abs(x) > 45 || Math.abs(z) > 45) return true;

        // Check center block (simplified)
        if (Math.abs(x) < 8 && Math.abs(z) < 8) return true;

        // Check known cover positions (from Arena.js)
        const coverBlocks = [
            { x: -30, z: 0 }, { x: 30, z: 0 },
            { x: -15, z: 15 }, { x: 15, z: 15 },
            { x: -15, z: -15 }, { x: 15, z: -15 }
        ];

        for (const block of coverBlocks) {
            const dx = x - block.x;
            const dz = z - block.z;
            if (Math.abs(dx) < 4 && Math.abs(dz) < 4) return true;
        }

        return false;
    }

    /**
     * Find a path between two points
     * @param {THREE.Vector3} start - Starting position
     * @param {THREE.Vector3} end - Target position
     * @returns {Array<THREE.Vector3>|null} Array of waypoints or null if no path found
     */
    findPath(start, end) {
        if (!this.initialized) {
            console.warn('PathfindingManager not initialized');
            return null;
        }

        // Check cache first
        const cacheKey = `${start.x},${start.y},${start.z}-${end.x},${end.y},${end.z}`;
        const cached = this.pathCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.path;
        }

        try {
            // Find the closest navigation mesh nodes to start and end
            const startGroup = this.pathfinding.getGroup(this.zoneId, start);
            const endGroup = this.pathfinding.getGroup(this.zoneId, end);

            if (startGroup === null || startGroup === undefined || endGroup === null || endGroup === undefined) {
                console.warn('Could not find navigation groups for start/end positions');
                return null;
            }

            // Calculate path
            const path = this.pathfinding.findPath(start, end, this.zoneId, startGroup);

            if (path && path.length > 0) {
                // Cache the result
                this.pathCache.set(cacheKey, {
                    path: path,
                    timestamp: Date.now()
                });

                return path;
            }
        } catch (error) {
            console.warn('Pathfinding error:', error);
        }

        return null;
    }

    /**
     * Find a path with smoothing for more natural movement
     * @param {THREE.Vector3} start - Starting position
     * @param {THREE.Vector3} end - Target position
     * @returns {Array<THREE.Vector3>|null} Smoothed path waypoints
     */
    findSmoothPath(start, end) {
        const path = this.findPath(start, end);
        if (!path) return null;

        // Simple path smoothing - remove unnecessary waypoints
        if (path.length <= 2) return path;

        const smoothed = [path[0]];
        let current = 0;

        while (current < path.length - 1) {
            // Look ahead to find the farthest visible waypoint
            let farthest = current + 1;
            for (let i = current + 2; i < path.length; i++) {
                if (this.hasLineOfSight(path[current], path[i])) {
                    farthest = i;
                } else {
                    break;
                }
            }
            smoothed.push(path[farthest]);
            current = farthest;
        }

        return smoothed;
    }

    /**
     * Check if there's a clear line of sight between two points
     * @param {THREE.Vector3} from - Start point
     * @param {THREE.Vector3} to - End point
     * @returns {boolean}
     */
    hasLineOfSight(from, to) {
        // Simplified LOS check - would need proper raycasting in production
        const distance = from.distanceTo(to);
        const steps = Math.ceil(distance / 2); // Check every 2 units

        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const x = from.x + (to.x - from.x) * t;
            const z = from.z + (to.z - from.z) * t;

            if (this.isObstacle(x, z, null)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Get the next waypoint in a path
     * @param {Array<THREE.Vector3>} path - The full path
     * @param {THREE.Vector3} currentPos - Current position
     * @param {number} waypointThreshold - Distance to consider waypoint reached
     * @returns {THREE.Vector3|null} Next waypoint or null if path complete
     */
    getNextWaypoint(path, currentPos, waypointThreshold = 2) {
        if (!path || path.length === 0) return null;

        // Find the first waypoint that's far enough away
        for (const waypoint of path) {
            const distance = currentPos.distanceTo(waypoint);
            if (distance > waypointThreshold) {
                return waypoint;
            }
        }

        // All waypoints are close, return the last one
        return path[path.length - 1];
    }

    /**
     * Clear the path cache (call when arena changes)
     */
    clearCache() {
        this.pathCache.clear();
    }

    /**
     * Get the navigation mesh for debugging visualization
     * @returns {THREE.Mesh|null}
     */
    getNavMesh() {
        return this.navMesh;
    }

    /**
     * Toggle navigation mesh visibility for debugging
     * @param {boolean} visible - Whether to show the nav mesh
     */
    setNavMeshVisible(visible) {
        if (this.navMesh) {
            this.navMesh.visible = visible;
        }
    }

    /**
     * Check if pathfinding is ready
     * @returns {boolean}
     */
    isReady() {
        return this.initialized && this.navMesh !== null;
    }
}

// Create singleton instance
const pathfindingManager = new PathfindingManager();
export default pathfindingManager;
