/**
 * AmmoPhysics - Integration module for Ammo.js (Bullet Physics Engine)
 *
 * This module provides enhanced physics capabilities using Ammo.js alongside
 * the existing Rapier physics engine. Ammo.js is used for:
 * - Advanced ragdoll physics with constraints
 * - Soft body physics for environmental effects
 * - Vehicle physics (future enhancement)
 * - Complex constraint systems
 */

class AmmoPhysics {
    constructor() {
        this.Ammo = null;
        this.physicsWorld = null;
        this.rigidBodies = [];
        this.softBodies = [];
        this.constraints = [];
        this.tmpTrans = null;
        this.initialized = false;

        // Physics configuration
        this.gravityConstant = -30.0; // Match Rapier gravity for consistency
        this.timeStep = 1.0 / 60.0;
        this.maxSubSteps = 3;
    }

    /**
     * Initialize Ammo.js physics engine
     * @returns {Promise<void>}
     */
    async init() {
        if (this.initialized) return;

        try {
            // Dynamically import Ammo.js
            const AmmoLib = await import('ammo.js');
            // ammo.js may export a factory function (default) or already-resolved object
            const AmmoFactory = AmmoLib.default;
            this.Ammo = typeof AmmoFactory === 'function' ? await AmmoFactory() : AmmoFactory;
        } catch (e) {
            console.warn('AmmoPhysics: failed to load ammo.js, physics disabled:', e.message);
            return;
        }

        // Setup collision configuration
        const collisionConfiguration = new this.Ammo.btDefaultCollisionConfiguration();
        const dispatcher = new this.Ammo.btCollisionDispatcher(collisionConfiguration);
        const overlappingPairCache = new this.Ammo.btDbvtBroadphase();
        const solver = new this.Ammo.btSequentialImpulseConstraintSolver();

        // Create the physics world
        this.physicsWorld = new this.Ammo.btDiscreteDynamicsWorld(
            dispatcher,
            overlappingPairCache,
            solver,
            collisionConfiguration
        );

        // Set gravity
        this.physicsWorld.setGravity(new this.Ammo.btVector3(0, this.gravityConstant, 0));

        // Create transform helper for later use
        this.tmpTrans = new this.Ammo.btTransform();

        this.initialized = true;
        console.log('Ammo.js Physics initialized (Gravity -30)');
    }

    /**
     * Create a dynamic rigid body (for ragdolls, debris, etc.)
     * @param {number} mass - Mass in kg (0 = static)
     * @param {THREE.Vector3} position - Initial position
     * @param {THREE.Quaternion} quaternion - Initial rotation
     * @param {Object} shape - Collision shape descriptor {type, ...params}
     * @returns {Object} {body, shape}
     */
    createRigidBody(mass, position, quaternion, shapeDesc) {
        if (!this.initialized) {
            console.warn('AmmoPhysics not initialized');
            return null;
        }

        let shape;

        // Create collision shape based on type
        switch (shapeDesc.type) {
            case 'box':
                shape = new this.Ammo.btBoxShape(
                    new this.Ammo.btVector3(shapeDesc.hx, shapeDesc.hy, shapeDesc.hz)
                );
                break;
            case 'sphere':
                shape = new this.Ammo.btSphereShape(shapeDesc.radius);
                break;
            case 'capsule':
                shape = new this.Ammo.btCapsuleShape(shapeDesc.radius, shapeDesc.height);
                break;
            case 'cylinder':
                shape = new this.Ammo.btCylinderShape(
                    new this.Ammo.btVector3(shapeDesc.rx, shapeDesc.ry, shapeDesc.rz)
                );
                break;
            default:
                console.warn('Unknown shape type:', shapeDesc.type);
                return null;
        }

        // Create transform
        const transform = new this.Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new this.Ammo.btVector3(position.x, position.y, position.z));
        transform.setRotation(new this.Ammo.btQuaternion(
            quaternion.x, quaternion.y, quaternion.z, quaternion.w
        ));

        // Create motion state
        const motionState = new this.Ammo.btDefaultMotionState(transform);

        // Calculate local inertia
        const localInertia = new this.Ammo.btVector3(0, 0, 0);
        if (mass > 0) {
            shape.calculateLocalInertia(mass, localInertia);
        }

        // Create rigid body
        const rbInfo = new this.Ammo.btRigidBodyConstructionInfo(
            mass, motionState, shape, localInertia
        );
        const body = new this.Ammo.btRigidBody(rbInfo);

        // Add to world
        this.physicsWorld.addRigidBody(body);
        this.rigidBodies.push(body);

        return { body, shape };
    }

    /**
     * Create a hinge constraint (for ragdoll joints)
     * @param {Object} bodyA - First rigid body
     * @param {Object} bodyB - Second rigid body
     * @param {THREE.Vector3} pivotA - Pivot point in A's local space
     * @param {THREE.Vector3} pivotB - Pivot point in B's local space
     * @param {THREE.Vector3} axisA - Hinge axis in A's local space
     * @param {THREE.Vector3} axisB - Hinge axis in B's local space
     * @param {boolean} disableCollisions - Whether to disable collisions between bodies
     * @returns {Object} Hinge constraint
     */
    createHingeConstraint(bodyA, bodyB, pivotA, pivotB, axisA, axisB, disableCollisions = true) {
        if (!this.initialized) return null;

        const constraint = new this.Ammo.btHingeConstraint(
            bodyA,
            bodyB,
            new this.Ammo.btVector3(pivotA.x, pivotA.y, pivotA.z),
            new this.Ammo.btVector3(pivotB.x, pivotB.y, pivotB.z),
            new this.Ammo.btVector3(axisA.x, axisA.y, axisA.z),
            new this.Ammo.btVector3(axisB.x, axisB.y, axisB.z),
            disableCollisions
        );

        this.physicsWorld.addConstraint(constraint, disableCollisions);
        this.constraints.push(constraint);

        return constraint;
    }

    /**
     * Create a cone twist constraint (for ragdoll ball-socket joints)
     * @param {Object} bodyA - First rigid body
     * @param {Object} bodyB - Second rigid body
     * @param {THREE.Vector3} pivotA - Pivot point in A's local space
     * @param {THREE.Vector3} pivotB - Pivot point in B's local space
     * @param {boolean} disableCollisions - Whether to disable collisions
     * @returns {Object} Cone twist constraint
     */
    createConeTwistConstraint(bodyA, bodyB, pivotA, pivotB, disableCollisions = true) {
        if (!this.initialized) return null;

        const transformA = new this.Ammo.btTransform();
        transformA.setIdentity();
        transformA.setOrigin(new this.Ammo.btVector3(pivotA.x, pivotA.y, pivotA.z));

        const transformB = new this.Ammo.btTransform();
        transformB.setIdentity();
        transformB.setOrigin(new this.Ammo.btVector3(pivotB.x, pivotB.y, pivotB.z));

        const constraint = new this.Ammo.btConeTwistConstraint(bodyA, bodyB, transformA, transformB);

        this.physicsWorld.addConstraint(constraint, disableCollisions);
        this.constraints.push(constraint);

        return constraint;
    }

    /**
     * Update rigid body transform from Three.js object
     * @param {Object} body - Ammo rigid body
     * @param {THREE.Object3D} threeObject - Three.js object to sync
     */
    updateBodyFromThreeObject(body, threeObject) {
        if (!this.initialized || !body) return;

        const transform = new this.Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new this.Ammo.btVector3(
            threeObject.position.x,
            threeObject.position.y,
            threeObject.position.z
        ));
        transform.setRotation(new this.Ammo.btQuaternion(
            threeObject.quaternion.x,
            threeObject.quaternion.y,
            threeObject.quaternion.z,
            threeObject.quaternion.w
        ));

        const motionState = body.getMotionState();
        if (motionState) {
            motionState.setWorldTransform(transform);
        }
        body.setWorldTransform(transform);
    }

    /**
     * Update Three.js object from rigid body transform
     * @param {Object} body - Ammo rigid body
     * @param {THREE.Object3D} threeObject - Three.js object to update
     */
    updateThreeObjectFromBody(body, threeObject) {
        if (!this.initialized || !body) return;

        const motionState = body.getMotionState();
        if (motionState) {
            motionState.getWorldTransform(this.tmpTrans);
            const p = this.tmpTrans.getOrigin();
            const q = this.tmpTrans.getRotation();

            threeObject.position.set(p.x(), p.y(), p.z());
            threeObject.quaternion.set(q.x(), q.y(), q.z(), q.w());
        }
    }

    /**
     * Apply impulse to rigid body
     * @param {Object} body - Ammo rigid body
     * @param {THREE.Vector3} impulse - Impulse vector
     * @param {THREE.Vector3} relativePos - Point of application (relative to center)
     */
    applyImpulse(body, impulse, relativePos = null) {
        if (!this.initialized || !body) return;

        const ammoImpulse = new this.Ammo.btVector3(impulse.x, impulse.y, impulse.z);

        if (relativePos) {
            const ammoRelPos = new this.Ammo.btVector3(relativePos.x, relativePos.y, relativePos.z);
            body.applyImpulse(ammoImpulse, ammoRelPos);
        } else {
            body.applyCentralImpulse(ammoImpulse);
        }
    }

    /**
     * Remove a rigid body from the world
     * @param {Object} body - Body to remove
     */
    removeBody(body) {
        if (!this.initialized || !body) return;

        this.physicsWorld.removeRigidBody(body);
        const index = this.rigidBodies.indexOf(body);
        if (index > -1) {
            this.rigidBodies.splice(index, 1);
        }
    }

    /**
     * Remove a constraint from the world
     * @param {Object} constraint - Constraint to remove
     */
    removeConstraint(constraint) {
        if (!this.initialized || !constraint) return;

        this.physicsWorld.removeConstraint(constraint);
        const index = this.constraints.indexOf(constraint);
        if (index > -1) {
            this.constraints.splice(index, 1);
        }
    }

    /**
     * Step the physics simulation
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        if (!this.initialized || !this.physicsWorld) return;

        // Step simulation with fixed timestep
        this.physicsWorld.stepSimulation(deltaTime, this.maxSubSteps, this.timeStep);
    }

    /**
     * Get the number of active rigid bodies
     * @returns {number}
     */
    getBodyCount() {
        return this.rigidBodies.length;
    }

    /**
     * Check if physics is initialized
     * @returns {boolean}
     */
    isInitialized() {
        return this.initialized;
    }
}

// Create singleton instance
const ammoPhysics = new AmmoPhysics();
export default ammoPhysics;
