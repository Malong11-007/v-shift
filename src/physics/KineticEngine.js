import * as THREE from 'three';
import physics from './PhysicsWorld.js';
import input from '../core/InputManager.js';
import audioManager from '../core/AudioManager.js';

export default class KineticEngine {
    /**
     * @param {RAPIER.RigidBody} rigidBody 
     * @param {THREE.Camera} camera 
     */
    constructor(rigidBody, camera) {
        this.body = rigidBody;
        this.camera = camera;
        
        // Tuning variables for Vector-Station feel
        this.maxSpeed = 12.0;       // target walk/run speed
        this.acceleration = 120.0;  // how fast to reach max speed
        this.friction = 10.0;       // ground friction when not pressing keys
        this.airAcceleration = 20.0; // slower acceleration in air
        this.jumpForce = 12.0;      // snappy jump height
        this.surgeMultiplier = 1.0;
        this.surgeDuration = 0;
        this.surgeRemaining = 0;
        
        // B-hop tracking
        this.lastGroundedTime = 0;
        this.consecutiveJumps = 0;
        this.bhopWindow = 0.05; // 50ms window for a Perfect Link
        
        // State
        this.isGrounded = false;
        this.isSliding = false;
        
        // Scratch vectors to avoid garbage collection
        this.velocity = new THREE.Vector3();
        this.inputVector = new THREE.Vector3();
        this.camForward = new THREE.Vector3();
        this.camRight = new THREE.Vector3();
        
        // Bind custom events
        window.addEventListener('onJump', this.handleJump.bind(this));
        window.addEventListener('momentumSurge', (e) => this.startSurge(e.detail));
    }

    setGrounded(isGrounded) {
        if (!this.isGrounded && isGrounded) {
            // Just landed
            this.lastGroundedTime = performance.now() / 1000;
        }
        this.isGrounded = isGrounded;
        
        // If we landed and didn't jump soon enough, reset combo
        if (isGrounded && (performance.now() / 1000) - this.lastGroundedTime > this.bhopWindow) {
            if (this.consecutiveJumps > 0) {
                // Combo broken
                this.consecutiveJumps = 0;
            }
        }
    }

    handleJump() {
        if (this.isGrounded || (performance.now() / 1000) - this.lastGroundedTime <= this.bhopWindow) {
            // Apply jump impulse
            const currentVel = this.body.linvel();
            this.body.setLinvel({ x: currentVel.x, y: this.jumpForce, z: currentVel.z }, true);
            audioManager.playSyntheticSfx('jump');
            
            // B-hop logic
            if ((performance.now() / 1000) - this.lastGroundedTime <= this.bhopWindow) {
                this.consecutiveJumps++;
                // Apply a small speed boost for the perfect link
                const speedBoost = 1.05;
                this.body.setLinvel({ 
                    x: currentVel.x * speedBoost, 
                    y: this.jumpForce, 
                    z: currentVel.z * speedBoost 
                }, true);
                
                // Play bhop success SFX
                audioManager.playSyntheticSfx('bhop_success');
                
                // Fire event for UI
                window.dispatchEvent(new CustomEvent('onBhop', { detail: this.consecutiveJumps }));
            }
            
            this.setGrounded(false);
        }
    }

    startSurge(detail = {}) {
        const multiplier = Math.max(1, detail.multiplier || 1.2);
        const duration = Math.max(0.5, detail.duration || 3);
        this.surgeMultiplier = multiplier;
        this.surgeDuration = duration;
        this.surgeRemaining = duration;

        window.dispatchEvent(new CustomEvent('momentumSurgeUpdate', {
            detail: {
                active: true,
                remaining: this.surgeRemaining,
                duration: this.surgeDuration,
                multiplier: this.surgeMultiplier
            }
        }));
    }

    update(delta) {
        if (!this.body) return;

        const surgeActive = this.surgeRemaining > 0;
        const speedBoost = surgeActive ? this.surgeMultiplier : 1;

        // 1. Calculate input vector relative to camera yaw
        let ix = 0;
        let iz = 0;
        if (input.isKeyDown('KeyW')) iz -= 1;
        if (input.isKeyDown('KeyS')) iz += 1;
        if (input.isKeyDown('KeyA')) ix -= 1;
        if (input.isKeyDown('KeyD')) ix += 1;
        
        this.inputVector.set(ix, 0, iz).normalize();

        // Get camera forward (ignoring pitch)
        this.camera.getWorldDirection(this.camForward);
        this.camForward.y = 0;
        this.camForward.normalize();
        
        // Get camera right
        this.camRight.copy(this.camForward).cross(new THREE.Vector3(0, 1, 0)).normalize();

        // Calculate world space desired move direction
        const moveDir = new THREE.Vector3()
            .addScaledVector(this.camRight, this.inputVector.x)
            .addScaledVector(this.camForward, -this.inputVector.z);

        // 2. Fetch current velocity
        const linvel = this.body.linvel();
        this.velocity.set(linvel.x, 0, linvel.z); // ignore Y for ground horizontal math

        // 3. Apply Sliding logic (Cinch Slide)
        if (input.isKeyDown('KeyC') && this.isGrounded && this.velocity.length() > 5) {
            if (!this.isSliding) {
                audioManager.playSyntheticSfx('slide_start');
            }
            this.isSliding = true;
            // No friction, just momentum
        } else {
            this.isSliding = false;
        }

        // 4. Apply acceleration & friction
        if (this.isGrounded && !this.isSliding) {
            if (this.inputVector.lengthSq() > 0) {
                // Accelerating
                const speed = this.velocity.length();
                const effectiveMax = this.maxSpeed * speedBoost;
                if (speed < effectiveMax) {
                    this.velocity.addScaledVector(moveDir, this.acceleration * speedBoost * delta);
                    // clamp
                    if (this.velocity.length() > effectiveMax) {
                        this.velocity.normalize().multiplyScalar(effectiveMax);
                    }
                }
            } else {
                // Friction (deceleration)
                const speed = this.velocity.length();
                if (speed > 0) {
                    const drop = speed * this.friction * delta;
                    const newSpeed = Math.max(speed - drop, 0);
                    this.velocity.multiplyScalar(newSpeed / speed);
                }
            }
        } else if (!this.isGrounded) {
            // Air Strafing (Quake-style)
            const projectedVel = this.velocity.dot(moveDir);
            const effectiveMax = this.maxSpeed * speedBoost;
            let accelMag = this.airAcceleration * speedBoost * delta;
            
            // Limit air acceleration so we don't exceed max speed just by holding W
            // But if we're turning (strafing), it allows building velocity.
            if (projectedVel + accelMag > effectiveMax) {
                accelMag = Math.max(effectiveMax - projectedVel, 0);
            }
            
            this.velocity.addScaledVector(moveDir, accelMag);
        }

        // 5. Apply back to rigid body (keep Y as is)
        this.body.setLinvel({
            x: this.velocity.x,
            y: linvel.y,
            z: this.velocity.z
        }, true);
        
        // 6. Dispatch speed update for HUD speedometer
        const speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
        window.dispatchEvent(new CustomEvent('playerSpeedUpdate', { 
            detail: { speed, bhopChain: this.consecutiveJumps } 
        }));

        if (surgeActive) {
            this.surgeRemaining = Math.max(0, this.surgeRemaining - delta);
            window.dispatchEvent(new CustomEvent('momentumSurgeUpdate', {
                detail: {
                    active: this.surgeRemaining > 0,
                    remaining: this.surgeRemaining,
                    duration: this.surgeDuration,
                    multiplier: this.surgeMultiplier
                }
            }));
            if (this.surgeRemaining === 0) {
                window.dispatchEvent(new Event('momentumSurgeExpired'));
            }
        }
    }
}
