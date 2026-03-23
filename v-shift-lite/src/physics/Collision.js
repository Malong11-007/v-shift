import physics from './PhysicsWorld.js';
import * as THREE from 'three';

class CollisionSystem {
    constructor() {
        this.colliderMap = new Map();
    }
    
    /**
     * Casts a ray from the given origin in the given direction.
     * Used for hitscan weapons like the Sniper or AR.
     * @param {THREE.Vector3} origin 
     * @param {THREE.Vector3} direction 
     * @param {number} maxDist 
     * @returns {object|null} { hit: true, point: THREE.Vector3, normal: THREE.Vector3, entity: any }
     */
    castRay(origin, direction, maxDist = 1000, excludeCollider = null) {
        if (!physics.world) return null;

        const ray = new physics.RAPIER.Ray(origin, direction);
        
        let hit;
        if (excludeCollider) {
            // Use query pipeline with filter to exclude the player's own collider
            const filterFlags = undefined;
            const filterGroups = undefined;
            const excludeRigidBody = undefined;
            hit = physics.world.castRay(ray, maxDist, true, filterFlags, filterGroups, excludeCollider, excludeRigidBody);
        } else {
            hit = physics.world.castRay(ray, maxDist, true);
        }

        if (hit) {
            const hitPoint = ray.pointAt(hit.timeOfImpact);
            const normalHit = physics.world.castRayAndGetNormal(ray, maxDist, true);
            
            return {
                hit: true,
                point: new THREE.Vector3(hitPoint.x, hitPoint.y, hitPoint.z),
                normal: normalHit ? new THREE.Vector3(normalHit.normal.x, normalHit.normal.y, normalHit.normal.z) : new THREE.Vector3(0, 1, 0),
                collider: hit.collider
            };
        }

        return null;
    }

    /**
     * Specialized raycast straight down from the player to detect grounding.
     * @param {THREE.Vector3} playerPosition 
     * @param {number} halfHeight 
     * @returns {boolean}
     */
    isGrounded(playerPosition, halfHeight) {
        if (!physics.world) return false;

        // Cast ray straight down from player's center
        // The ray origins slightly above the bottom of the capsule to avoid self-colliding if not filtered
        const origin = { x: playerPosition.x, y: playerPosition.y - halfHeight + 0.1, z: playerPosition.z };
        const dir = { x: 0, y: -1, z: 0 };
        const ray = new physics.RAPIER.Ray(origin, dir);
        
        // We only check a very short distance (0.1 inside + 0.1 outside)
        const hit = physics.world.castRay(ray, 0.2, true);
        
        return hit !== null;
    }
}

const collision = new CollisionSystem();
export default collision;
