import * as THREE from 'three';

class ProceduralAnimator {
    constructor(character) {
        this.character = character;
        this.state = 'IDLE';
        this.time = 0;
        this.weight = 0;
        this.targetWeight = 1;
        this.lookAtYaw = 0;     // Head horizontal look offset
        this.lookAtPitch = 0;   // Head vertical look offset
        
        // Configuration
        this.config = {
            idle: { speed: 1.5, bodyBob: 0.005, armSway: 0.02 },
            walk: { speed: 8.0, legSwing: 0.4, armSwing: 0.3, bodyBob: 0.02 },
            run: { speed: 12.0, legSwing: 0.7, armSwing: 0.5, bodyBob: 0.04, lean: 0.15 }
        };
        
        // Animation blending
        this.blendFactor = 0;
        this.prevState = 'IDLE';
        this.stateTime = 0;
        
        this.resetJoints();
    }

    resetJoints() {
        const c = this.character;
        c.hips.position.set(0, 0.9, 0);
        c.hips.rotation.set(0, 0, 0);
        c.spine.rotation.set(0, 0, 0);
        c.chest.rotation.set(0, 0, 0);
        c.shoulderR.rotation.set(0, 0, 0);
        c.shoulderL.rotation.set(0, 0, 0);
        c.elbowR.rotation.set(0, 0, 0);
        c.elbowL.rotation.set(0, 0, 0);
        c.legR.rotation.set(0, 0, 0);
        c.legL.rotation.set(0, 0, 0);
        c.kneeR.rotation.set(0, 0, 0);
        c.kneeL.rotation.set(0, 0, 0);
        c.neck.rotation.set(0, 0, 0);
        c.head.rotation.set(0, 0, 0);
    }

    setState(newState) {
        if (this.state === newState) return;
        this.prevState = this.state;
        this.state = newState;
        this.stateTime = 0;
        this.blendFactor = 0;
    }

    /**
     * Set head look direction (for bots tracking targets)
     */
    setLookAt(yaw, pitch) {
        this.lookAtYaw = THREE.MathUtils.clamp(yaw, -1.2, 1.2);
        this.lookAtPitch = THREE.MathUtils.clamp(pitch, -0.6, 0.8);
    }

    update(dt) {
        this.time += dt;
        this.stateTime += dt;
        const c = this.character;
        
        this.resetJoints();

        // Blend transitions (smooth 0.2s fade)
        if (this.blendFactor < 1) {
            this.blendFactor = Math.min(1, this.blendFactor + dt * 5);
        }

        switch(this.state) {
            case 'IDLE':
                this.animateIdle(dt);
                break;
            case 'WALK':
                this.animateLocomotion(dt, this.config.walk);
                break;
            case 'RUN':
                this.animateLocomotion(dt, this.config.run);
                break;
            case 'DEATH':
                this.animateDeath(dt);
                break;
        }

        // Apply head look-at (overlay on all states)
        this.applyHeadLookAt();
    }

    animateIdle(dt) {
        const t = this.time * this.config.idle.speed;
        const c = this.character;
        
        // Breathing cycle
        c.chest.position.y = 0.25 + Math.sin(t) * 0.006;
        c.spine.rotation.x = Math.sin(t * 0.8) * 0.01;
        
        // Subtle arm sway
        c.shoulderR.rotation.z = Math.sin(t * 0.5) * 0.025;
        c.shoulderL.rotation.z = -Math.sin(t * 0.5) * 0.025;
        
        // Weight shift (very subtle hip sway)
        c.hips.position.x = Math.sin(t * 0.3) * 0.003;
        c.hips.rotation.z = Math.sin(t * 0.3) * 0.008;
        
        // Idle finger/hand micro-movement
        if (c.handR) c.handR.rotation.x = Math.sin(t * 2) * 0.03;
        if (c.handL) c.handL.rotation.x = Math.sin(t * 2.3) * 0.02;
    }

    animateLocomotion(dt, cfg) {
        const t = this.time * cfg.speed;
        const c = this.character;
        
        // 1. Hips Bob & Sway (Weight Shift)
        c.hips.position.y = 0.9 + Math.abs(Math.sin(t)) * cfg.bodyBob;
        c.hips.rotation.z = Math.cos(t) * 0.05;
        c.hips.rotation.y = Math.sin(t) * 0.1;
        
        // 2. Chest Counter-Rotation (Balance)
        c.chest.rotation.y = -Math.sin(t) * 0.08;
        c.chest.rotation.z = -Math.cos(t) * 0.03;
        
        // 3. Spine lean (forward lean when running)
        if (cfg.lean) {
            c.spine.rotation.x = cfg.lean;
            // Additional chest compression while running
            c.chest.rotation.x = -0.05;
        }
        
        // 4. Leg Swing with natural gait
        c.legR.rotation.x = Math.sin(t) * cfg.legSwing;
        c.legL.rotation.x = -Math.sin(t) * cfg.legSwing;
        
        // Bend knees when lifting legs (IK hint)
        c.kneeR.rotation.x = Math.max(0, -Math.sin(t)) * cfg.legSwing * 1.5;
        c.kneeL.rotation.x = Math.max(0, Math.sin(t)) * cfg.legSwing * 1.5;
        
        // Foot plant correction (reduce toe drag)
        if (c.footR) c.footR.rotation.x = Math.max(0, Math.sin(t)) * 0.2;
        if (c.footL) c.footL.rotation.x = Math.max(0, -Math.sin(t)) * 0.2;
        
        // 5. Arm Swing (opposing legs, reduced when holding weapon)
        const armWeight = this.weaponPose ? 0.15 : 1.0;
        c.shoulderR.rotation.x = -Math.sin(t) * cfg.armSwing * armWeight;
        c.shoulderL.rotation.x = Math.sin(t) * cfg.armSwing * armWeight;
        
        // Elbow bend during arm swing
        c.elbowR.rotation.x = Math.max(0, Math.sin(t)) * 0.3 * armWeight;
        c.elbowL.rotation.x = Math.max(0, -Math.sin(t)) * 0.3 * armWeight;

        // 6. Secondary Motion (Head Bob & Counter)
        c.neck.rotation.x = Math.sin(t * 2) * 0.04;
        c.neck.rotation.y = Math.sin(t) * 0.025;
        c.neck.rotation.z = -Math.cos(t) * 0.015;
    }

    /**
     * Death stagger animation (brief collapse before ragdoll takes over)
     */
    animateDeath(dt) {
        const c = this.character;
        const progress = Math.min(this.stateTime * 3, 1);
        
        // Spine collapses forward
        c.spine.rotation.x = progress * 0.5;
        
        // Head drops
        c.neck.rotation.x = progress * 0.8;
        
        // Knees buckle
        c.kneeR.rotation.x = progress * 1.2;
        c.kneeL.rotation.x = progress * 1.0;
        
        // Arms go limp
        c.shoulderR.rotation.x = progress * 0.6;
        c.shoulderR.rotation.z = progress * 0.4;
        c.shoulderL.rotation.x = progress * 0.5;
        c.shoulderL.rotation.z = -progress * 0.3;
        
        c.elbowR.rotation.x = progress * 1.0;
        c.elbowL.rotation.x = progress * 0.8;
        
        // Hips drop
        c.hips.position.y = 0.9 - progress * 0.3;
    }
    
    /**
     * Applies head look direction as an overlay
     */
    applyHeadLookAt() {
        const c = this.character;
        // Neck handles most of the rotation
        c.neck.rotation.y += this.lookAtYaw * 0.6;
        c.neck.rotation.x += this.lookAtPitch * 0.4;
        // Head handles the remainder for overshoot
        c.head.rotation.y = this.lookAtYaw * 0.4;
        c.head.rotation.x = this.lookAtPitch * 0.6;
    }

    // Weapon attachment helper
    setWeaponPose(weaponType) {
        this.weaponPose = weaponType;
        const c = this.character;
        
        // Tactical "Chest Level" Hold
        c.shoulderR.rotation.set(-0.6, -0.4, 0);
        c.elbowR.rotation.set(0, -1.2, 0);
        c.handR.rotation.set(0.2, 0, 0);
        
        c.shoulderL.rotation.set(-0.8, 0.6, 0);
        c.elbowL.rotation.set(-1.0, 0, 0);
        c.handL.rotation.set(0.4, 0, 0);
    }

    /**
     * Aim-down-sights pose — tighter hold, weapon raised to eye level
     */
    setADSPose() {
        const c = this.character;
        this.weaponPose = 'ADS';
        
        // Right arm — pulled in tighter
        c.shoulderR.rotation.set(-0.8, -0.3, 0);
        c.elbowR.rotation.set(0, -1.4, 0);
        c.handR.rotation.set(0.3, 0, 0);
        
        // Left arm — supporting under barrel, extended forward
        c.shoulderL.rotation.set(-1.0, 0.5, 0);
        c.elbowL.rotation.set(-0.8, 0, 0);
        c.handL.rotation.set(0.5, 0, 0);
        
        // Slight forward lean
        c.spine.rotation.x = 0.08;
        c.chest.rotation.x = -0.04;
    }
}

export default ProceduralAnimator;
