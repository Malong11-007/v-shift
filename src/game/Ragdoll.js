import * as THREE from 'three';
import physics from '../physics/PhysicsWorld.js';
import engine from '../core/Engine.js';

export default class Ragdoll {
    /**
     * Creates a simplified ragdoll representation of a character.
     * @param {THREE.Group} model - The original character model to sample positions from
     * @param {THREE.Vector3} hitDirection - Direction of the fatal shot
     * @param {number} forceMultiplier - Force to apply (e.g. shotgun = higher)
     */
    constructor(model, hitDirection, forceMultiplier = 1.0) {
        this.bodies = [];
        this.group = new THREE.Group();
        this.group.position.copy(model.position);
        engine.scene.add(this.group);

        // We will create discrete boxes/capsules for Head, Torso, Arms, Legs
        // In a real ragdoll these would be joined by joints, but a loosely constrained or "gibbed" 
        // physics approach also works great for stylized low-poly games.
        // We'll use simple spherical joints to link limbs to the torso.

        this.createParts(model);
        this.applyImpact(hitDirection, forceMultiplier);

        // Persist temporarily or until cleared
        this.createdAt = performance.now();
        engine.updatables.push(this);
    }

    createParts(model) {
        if (!physics.world) return;

        const material = new THREE.MeshStandardMaterial({ color: 0x3366aa }); // Default blue team
        
        // Try to glean color from the original model if available
        let teamColor = 0x3366aa;
        model.traverse((child) => {
            if (child.isMesh && child.material && child.material.color) {
                teamColor = child.material.color.getHex();
            }
        });
        material.color.setHex(teamColor);

        // Helper to create a limb
        const createPart = (name, size, posOffset, mass) => {
            const geo = new THREE.BoxGeometry(size.x, size.y, size.z);
            const mesh = new THREE.Mesh(geo, material);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            this.group.add(mesh);

            // Create Physics
            const startPos = {
                x: model.position.x + posOffset.x,
                y: model.position.y + posOffset.y,
                z: model.position.z + posOffset.z
            };

            const bodyDesc = physics.RAPIER.RigidBodyDesc.dynamic().setTranslation(startPos.x, startPos.y, startPos.z);
            const body = physics.world.createRigidBody(bodyDesc);
            
            const colliderDesc = physics.RAPIER.ColliderDesc.cuboid(size.x / 2, size.y / 2, size.z / 2)
                .setMass(mass)
                .setFriction(0.8)
                .setRestitution(0.2);
            physics.world.createCollider(colliderDesc, body);

            const part = { mesh, body, startPos };
            this.bodies.push(part);
            return part;
        };

        // Torso
        const torso = createPart('Torso', {x: 0.6, y: 0.8, z: 0.4}, {x: 0, y: 1.0, z: 0}, 30);
        
        // Head
        const head = createPart('Head', {x: 0.4, y: 0.4, z: 0.4}, {x: 0, y: 1.7, z: 0}, 5);
        
        // Arms
        const armL = createPart('ArmL', {x: 0.2, y: 0.7, z: 0.2}, {x: -0.4, y: 1.1, z: 0}, 5);
        const armR = createPart('ArmR', {x: 0.2, y: 0.7, z: 0.2}, {x: 0.4, y: 1.1, z: 0}, 5);
        
        // Legs
        const legL = createPart('LegL', {x: 0.25, y: 0.9, z: 0.25}, {x: -0.2, y: 0.45, z: 0}, 10);
        const legR = createPart('LegR', {x: 0.25, y: 0.9, z: 0.25}, {x: 0.2, y: 0.45, z: 0}, 10);

        // Joints (linking limbs to torso)
        this.addJoint(torso.body, head.body, {x:0, y:0.4, z:0}, {x:0, y:-0.2, z:0});
        this.addJoint(torso.body, armL.body, {x:-0.3, y:0.3, z:0}, {x:0, y:0.35, z:0});
        this.addJoint(torso.body, armR.body, {x:0.3, y:0.3, z:0}, {x:0, y:0.35, z:0});
        this.addJoint(torso.body, legL.body, {x:-0.15, y:-0.4, z:0}, {x:0, y:0.45, z:0});
        this.addJoint(torso.body, legR.body, {x:0.15, y:-0.4, z:0}, {x:0, y:0.45, z:0});
    }

    addJoint(body1, body2, anchor1, anchor2) {
        if (!physics.world) return;
        const params = physics.RAPIER.JointData.spherical(anchor1, anchor2);
        physics.world.createImpulseJoint(params, body1, body2, true);
    }

    applyImpact(direction, multiplier) {
        // Apply a strong impulse to the torso, and subtle random spins to limbs
        if (this.bodies.length === 0) return;
        
        const forceMag = 1500 * multiplier;
        const impulse = {
            x: direction.x * forceMag,
            y: (direction.y * forceMag) + (forceMag * 0.2), // Kick slightly upwards
            z: direction.z * forceMag
        };

        // Torso is index 0
        this.bodies[0].body.applyImpulse(impulse, true);

        // Add some spin to everyone to make it look chaotic
        this.bodies.forEach(part => {
            part.body.applyTorqueImpulse({
                x: (Math.random() - 0.5) * 50 * multiplier,
                y: (Math.random() - 0.5) * 50 * multiplier,
                z: (Math.random() - 0.5) * 50 * multiplier
            }, true);
        });
    }

    update() {
        // Sync meshes
        this.bodies.forEach(part => {
            const rot = part.body.rotation();
            const pos = part.body.translation();
            
            part.mesh.position.set(pos.x, pos.y, pos.z);
            part.mesh.quaternion.set(rot.x, rot.y, rot.z, rot.w);
        });

        // Cleanup after 30 seconds
        if (performance.now() - this.createdAt > 30000) {
            this.destroy();
        }
    }

    destroy() {
        this.bodies.forEach(part => {
            this.group.remove(part.mesh);
            if (physics.world && part.body) {
                physics.world.removeRigidBody(part.body);
            }
        });
        engine.scene.remove(this.group);
        
        const idx = engine.updatables.indexOf(this);
        if (idx !== -1) {
            engine.updatables.splice(idx, 1);
        }
    }
}
