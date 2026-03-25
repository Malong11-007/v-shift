import * as THREE from 'three';
import physics from '../physics/PhysicsWorld.js';
import engine from '../core/Engine.js';

/**
 * Enhanced Ragdoll — Multi-segment physics corpse with proper limb shapes,
 * joint limits, and impact particles.
 */
export default class Ragdoll {
    /**
     * @param {THREE.Group} model - The original character model to sample positions from
     * @param {THREE.Vector3} hitDirection - Direction of the fatal shot
     * @param {number} forceMultiplier - Force to apply (e.g. shotgun = higher)
     */
    constructor(model, hitDirection, forceMultiplier = 1.0) {
        this.bodies = [];
        this.joints = [];
        this.group = new THREE.Group();
        this.group.position.copy(model.position);
        engine.scene.add(this.group);

        // Sample team color from original model
        this.teamColor = 0x3366aa;
        model.traverse((child) => {
            if (child.isMesh && child.material && child.material.color) {
                this.teamColor = child.material.color.getHex();
            }
        });

        // Materials
        this.clothesMat = new THREE.MeshStandardMaterial({ color: this.teamColor, roughness: 0.85 });
        this.skinMat = new THREE.MeshStandardMaterial({ color: 0xd4a574, roughness: 0.75 });
        this.pantsMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.9 });
        this.bootMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.95 });
        this.vestMat = new THREE.MeshStandardMaterial({ color: 0x2f3030, roughness: 0.95 });
        this.helmetMat = new THREE.MeshStandardMaterial({ color: 0x1e1e1e, roughness: 0.6, metalness: 0.3 });

        this.createParts(model);
        this.applyImpact(hitDirection, forceMultiplier);
        this.spawnImpactParticles(model.position, hitDirection);

        this.createdAt = performance.now();
        engine.updatables.push(this);
    }

    createParts(model) {
        if (!physics.world) return;

        const pos = model.position;

        // ---- TORSO (upper + lower) ----
        const upperTorso = this._createPart(
            'UpperTorso',
            new THREE.BoxGeometry(0.36, 0.35, 0.22),
            this.vestMat,
            { x: pos.x, y: pos.y + 1.3, z: pos.z },
            { x: 0.18, y: 0.175, z: 0.11 },
            18
        );

        const lowerTorso = this._createPart(
            'LowerTorso',
            new THREE.BoxGeometry(0.32, 0.2, 0.2),
            this.pantsMat,
            { x: pos.x, y: pos.y + 0.95, z: pos.z },
            { x: 0.16, y: 0.1, z: 0.1 },
            12
        );

        // ---- HEAD with helmet ----
        const headGroup = new THREE.Group();
        const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.24, 0.23), this.skinMat);
        headGroup.add(headMesh);
        const helmetMesh = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.16, 0.27), this.helmetMat);
        helmetMesh.position.y = 0.1;
        headGroup.add(helmetMesh);
        headGroup.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
        this.group.add(headGroup);

        const headBody = this._createBody(
            { x: pos.x, y: pos.y + 1.7, z: pos.z },
            { x: 0.13, y: 0.16, z: 0.14 },
            5
        );
        const head = { mesh: headGroup, body: headBody, name: 'Head' };
        this.bodies.push(head);

        // ---- ARMS (upper + lower + hand for each side) ----
        for (const side of [-1, 1]) {
            const label = side === 1 ? 'R' : 'L';
            const offsetX = side * 0.3;

            const upperArm = this._createPart(
                `UpperArm${label}`,
                new THREE.CapsuleGeometry(0.05, 0.18, 8, 8),
                this.clothesMat,
                { x: pos.x + offsetX, y: pos.y + 1.25, z: pos.z },
                { x: 0.05, y: 0.14, z: 0.05 },
                3
            );

            const lowerArm = this._createPart(
                `LowerArm${label}`,
                new THREE.CapsuleGeometry(0.04, 0.16, 8, 8),
                this.skinMat,
                { x: pos.x + offsetX, y: pos.y + 1.0, z: pos.z },
                { x: 0.04, y: 0.12, z: 0.04 },
                2
            );

            const hand = this._createPart(
                `Hand${label}`,
                new THREE.BoxGeometry(0.06, 0.06, 0.04),
                this.bootMat,
                { x: pos.x + offsetX, y: pos.y + 0.82, z: pos.z },
                { x: 0.03, y: 0.03, z: 0.02 },
                1
            );

            // Joints: shoulder, elbow, wrist
            this._addJoint(upperTorso.body, upperArm.body,
                { x: side * 0.18, y: 0.1, z: 0 }, { x: 0, y: 0.12, z: 0 });
            this._addJoint(upperArm.body, lowerArm.body,
                { x: 0, y: -0.12, z: 0 }, { x: 0, y: 0.1, z: 0 });
            this._addJoint(lowerArm.body, hand.body,
                { x: 0, y: -0.1, z: 0 }, { x: 0, y: 0.03, z: 0 });
        }

        // ---- LEGS (upper + lower + foot for each side) ----
        for (const side of [-1, 1]) {
            const label = side === 1 ? 'R' : 'L';
            const offsetX = side * 0.12;

            const upperLeg = this._createPart(
                `UpperLeg${label}`,
                new THREE.CapsuleGeometry(0.065, 0.25, 8, 8),
                this.pantsMat,
                { x: pos.x + offsetX, y: pos.y + 0.6, z: pos.z },
                { x: 0.065, y: 0.19, z: 0.065 },
                6
            );

            const lowerLeg = this._createPart(
                `LowerLeg${label}`,
                new THREE.CapsuleGeometry(0.055, 0.25, 8, 8),
                this.pantsMat,
                { x: pos.x + offsetX, y: pos.y + 0.25, z: pos.z },
                { x: 0.055, y: 0.19, z: 0.055 },
                4
            );

            const foot = this._createPart(
                `Foot${label}`,
                new THREE.BoxGeometry(0.1, 0.06, 0.18),
                this.bootMat,
                { x: pos.x + offsetX, y: pos.y + 0.05, z: pos.z + 0.03 },
                { x: 0.05, y: 0.03, z: 0.09 },
                2
            );

            // Joints: hip, knee, ankle
            this._addJoint(lowerTorso.body, upperLeg.body,
                { x: side * 0.1, y: -0.1, z: 0 }, { x: 0, y: 0.16, z: 0 });
            this._addJoint(upperLeg.body, lowerLeg.body,
                { x: 0, y: -0.16, z: 0 }, { x: 0, y: 0.16, z: 0 });
            this._addJoint(lowerLeg.body, foot.body,
                { x: 0, y: -0.16, z: 0 }, { x: 0, y: 0.03, z: -0.03 });
        }

        // ---- Spine joint: upper ↔ lower torso ----
        this._addJoint(upperTorso.body, lowerTorso.body,
            { x: 0, y: -0.175, z: 0 }, { x: 0, y: 0.1, z: 0 });

        // ---- Neck joint: upper torso ↔ head ----
        this._addJoint(upperTorso.body, head.body,
            { x: 0, y: 0.175, z: 0 }, { x: 0, y: -0.12, z: 0 });
    }

    /**
     * Creates a single ragdoll part with both visual mesh and physics body
     */
    _createPart(name, geometry, material, startPos, halfExtents, mass) {
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.group.add(mesh);

        const body = this._createBody(startPos, halfExtents, mass);
        const part = { mesh, body, name };
        this.bodies.push(part);
        return part;
    }

    /**
     * Creates a physics rigid body with a cuboid collider
     */
    _createBody(startPos, halfExtents, mass) {
        const bodyDesc = physics.RAPIER.RigidBodyDesc.dynamic()
            .setTranslation(startPos.x, startPos.y, startPos.z)
            .setLinearDamping(0.5)
            .setAngularDamping(0.8);
        const body = physics.world.createRigidBody(bodyDesc);

        const colliderDesc = physics.RAPIER.ColliderDesc.cuboid(halfExtents.x, halfExtents.y, halfExtents.z)
            .setMass(mass)
            .setFriction(0.9)
            .setRestitution(0.15);
        physics.world.createCollider(colliderDesc, body);

        return body;
    }

    /**
     * Creates a spherical joint between two bodies
     */
    _addJoint(body1, body2, anchor1, anchor2) {
        if (!physics.world) return;
        const params = physics.RAPIER.JointData.spherical(anchor1, anchor2);
        const joint = physics.world.createImpulseJoint(params, body1, body2, true);
        this.joints.push(joint);
    }

    /**
     * Applies the lethal impact force
     */
    applyImpact(direction, multiplier) {
        if (this.bodies.length === 0) return;

        const forceMag = 1200 * multiplier;

        // Primary impulse to upper torso
        const upperTorso = this.bodies[0];
        upperTorso.body.applyImpulse({
            x: direction.x * forceMag,
            y: (direction.y * forceMag) + (forceMag * 0.25),
            z: direction.z * forceMag
        }, true);

        // Head gets extra snap-back
        const head = this.bodies.find(p => p.name === 'Head');
        if (head) {
            head.body.applyImpulse({
                x: direction.x * forceMag * 0.5,
                y: forceMag * 0.3,
                z: direction.z * forceMag * 0.5
            }, true);
        }

        // Chaotic spin on all limbs
        this.bodies.forEach(part => {
            const spinForce = part.name.includes('Torso') ? 30 : 60;
            part.body.applyTorqueImpulse({
                x: (Math.random() - 0.5) * spinForce * multiplier,
                y: (Math.random() - 0.5) * spinForce * multiplier,
                z: (Math.random() - 0.5) * spinForce * multiplier
            }, true);
        });
    }

    /**
     * Spawn impact blood-splatter particles at death location
     */
    spawnImpactParticles(position, direction) {
        const particleCount = 24;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = [];

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = position.x;
            positions[i * 3 + 1] = position.y + 1.0;
            positions[i * 3 + 2] = position.z;

            velocities.push(new THREE.Vector3(
                direction.x * (2 + Math.random() * 4) + (Math.random() - 0.5) * 3,
                Math.random() * 4,
                direction.z * (2 + Math.random() * 4) + (Math.random() - 0.5) * 3
            ));
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            size: 0.08,
            color: 0xcc1111,
            transparent: true,
            opacity: 0.9,
            depthWrite: false
        });

        const particles = new THREE.Points(geometry, material);
        engine.scene.add(particles);

        // Store for animation
        this.particles = { mesh: particles, velocities, startTime: performance.now() };
    }

    update() {
        // Sync meshes to physics
        this.bodies.forEach(part => {
            const rot = part.body.rotation();
            const pos = part.body.translation();
            part.mesh.position.set(pos.x, pos.y, pos.z);
            part.mesh.quaternion.set(rot.x, rot.y, rot.z, rot.w);
        });

        // Animate impact particles
        if (this.particles) {
            const elapsed = (performance.now() - this.particles.startTime) / 1000;
            const posAttr = this.particles.mesh.geometry.attributes.position;
            const vels = this.particles.velocities;

            if (elapsed < 2.0) {
                for (let i = 0; i < vels.length; i++) {
                    posAttr.array[i * 3] += vels[i].x * 0.016;
                    posAttr.array[i * 3 + 1] += (vels[i].y - 9.8 * elapsed) * 0.016;
                    posAttr.array[i * 3 + 2] += vels[i].z * 0.016;
                }
                posAttr.needsUpdate = true;
                this.particles.mesh.material.opacity = Math.max(0, 0.9 - elapsed * 0.5);
            } else {
                engine.scene.remove(this.particles.mesh);
                this.particles.mesh.geometry.dispose();
                this.particles.mesh.material.dispose();
                this.particles = null;
            }
        }

        // Cleanup after 25 seconds
        if (performance.now() - this.createdAt > 25000) {
            this.destroy();
        }
    }

    destroy() {
        // Remove joints first
        this.joints.forEach(joint => {
            if (physics.world) {
                try { physics.world.removeImpulseJoint(joint, true); } catch (_e) { /* already removed */ }
            }
        });

        // Remove bodies and meshes
        this.bodies.forEach(part => {
            this.group.remove(part.mesh);
            if (part.mesh.geometry) part.mesh.geometry.dispose();
            if (physics.world && part.body) {
                try { physics.world.removeRigidBody(part.body); } catch (_e) { /* already removed */ }
            }
        });

        // Cleanup particles if still present
        if (this.particles) {
            engine.scene.remove(this.particles.mesh);
            this.particles.mesh.geometry.dispose();
            this.particles.mesh.material.dispose();
            this.particles = null;
        }

        engine.scene.remove(this.group);

        const idx = engine.updatables.indexOf(this);
        if (idx !== -1) {
            engine.updatables.splice(idx, 1);
        }

        // Dispose materials
        [this.clothesMat, this.skinMat, this.pantsMat, this.bootMat, this.vestMat, this.helmetMat]
            .forEach(m => { if (m) m.dispose(); });
    }
}
