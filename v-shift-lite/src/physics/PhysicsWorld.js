import RAPIER from '@dimforge/rapier3d-compat';

class PhysicsWorld {
    constructor() {
        this.world = null;
        this.RAPIER = null;
        
        // Fixed timestep for physics (60Hz)
        this.timeStep = 1.0 / 60.0;
        this.accumulator = 0;
    }

    /**
     * Initialize the Rapier WASM module and create physics world
     */
    async init() {
        await RAPIER.init();
        this.RAPIER = RAPIER;
        
        // Gravity pointing down (Stronger than real life for snappy feel)
        const gravity = { x: 0.0, y: -30.0, z: 0.0 };
        this.world = new RAPIER.World(gravity);
        
        console.log('Rapier Physics initialized (Gravity -30)');
        return this.world;
    }

    /**
     * Create a static box collider for environment geometry
     * @param {number} x - position X
     * @param {number} y - position Y
     * @param {number} z - position Z
     * @param {number} hx - half-extent X
     * @param {number} hy - half-extent Y
     * @param {number} hz - half-extent Z
     * @returns {RAPIER.Collider}
     */
    createStaticBox(x, y, z, hx, hy, hz) {
        if (!this.world) return null;
        const bodyDesc = this.RAPIER.RigidBodyDesc.fixed().setTranslation(x, y, z);
        const body = this.world.createRigidBody(bodyDesc);
        const colliderDesc = this.RAPIER.ColliderDesc.cuboid(hx, hy, hz);
        return this.world.createCollider(colliderDesc, body);
    }

    /**
     * Create a kinematic or dynamic capsule body for the player
     * @param {number} x - start X
     * @param {number} y - start Y
     * @param {number} z - start Z
     * @param {number} halfHeight
     * @param {number} radius
     * @returns {RAPIER.RigidBody}
     */
    createPlayerCapsule(x, y, z, halfHeight, radius) {
        if (!this.world) return null;
        // Dynamic rigid body but rotation locked
        const bodyDesc = this.RAPIER.RigidBodyDesc.dynamic()
            .setTranslation(x, y, z)
            .lockRotations();
        const body = this.world.createRigidBody(bodyDesc);
        
        const colliderDesc = this.RAPIER.ColliderDesc.capsule(halfHeight, radius)
            .setFriction(0.0) // We handle custom ground friction
            .setRestitution(0.0);
            
        const collider = this.world.createCollider(colliderDesc, body);
        return { body, collider };
    }

    /**
     * Step the physics simulation using a fixed timestep.
     */
    update(delta) {
        if (!this.world) return;
        
        this.accumulator += delta;
        
        // Prevent spiral of death
        if (this.accumulator > 0.1) this.accumulator = 0.1;
        
        while (this.accumulator >= this.timeStep) {
            this.world.step();
            this.accumulator -= this.timeStep;
        }
    }
}

const physicsWorld = new PhysicsWorld();
export default physicsWorld;
