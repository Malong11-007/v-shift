import * as THREE from 'three';

class ProceduralAnimator {
    constructor(character) {
        this.character = character;
        this.state = 'IDLE';
        this.time = 0;
        this.weight = 0; // For blending transitions
        this.targetWeight = 1;
        
        // Configuration
        this.config = {
            idle: { speed: 1.5, bodyBob: 0.005, armSway: 0.02 },
            walk: { speed: 8.0, legSwing: 0.4, armSwing: 0.3, bodyBob: 0.02 },
            run: { speed: 12.0, legSwing: 0.7, armSwing: 0.5, bodyBob: 0.04, lean: 0.15 }
        };
        
        this.resetJoints();
    }

    resetJoints() {
        const c = this.character;
        // Default T-pose/Neutral
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
    }

    setState(newState) {
        if (this.state === newState) return;
        this.state = newState;
        // Reset time or blend? For now, just switch.
    }

    update(dt) {
        this.time += dt;
        const c = this.character;
        
        // Reset per frame to avoid accumulation (or use lerp for smoothness)
        this.resetJoints();

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
        }
    }

    animateIdle(dt) {
        const t = this.time * this.config.idle.speed;
        const c = this.character;
        
        // Breathe
        c.chest.position.y = 0.25 + Math.sin(t) * 0.005;
        
        // Slight arm sway
        c.shoulderR.rotation.z = Math.sin(t * 0.5) * 0.02;
        c.shoulderL.rotation.z = -Math.sin(t * 0.5) * 0.02;
    }

    animateLocomotion(dt, cfg) {
        const t = this.time * cfg.speed;
        const c = this.character;
        
        // 1. Hips Bob & Sway (Weight Shift)
        // Vertical bob (stays positive)
        c.hips.position.y = 0.9 + Math.abs(Math.sin(t)) * cfg.bodyBob;
        // Pelvic tilt (Z) - hips tilt down toward the swinging leg
        c.hips.rotation.z = Math.cos(t) * 0.05;
        // Hips rotation (Y) - hips rotate forward with the swinging leg
        c.hips.rotation.y = Math.sin(t) * 0.1;
        
        // 2. Chest Counter-Rotation (Balance)
        // Chest rotates opposite to hips to keep shoulders squareish
        c.chest.rotation.y = -Math.sin(t) * 0.08;
        // Slight side-to-side sway
        c.chest.rotation.z = -Math.cos(t) * 0.03;
        
        // 3. Leg Swing
        c.legR.rotation.x = Math.sin(t) * cfg.legSwing;
        c.legL.rotation.x = -Math.sin(t) * cfg.legSwing;
        
        // Bend knees when lifting legs
        c.kneeR.rotation.x = Math.max(0, -Math.sin(t)) * cfg.legSwing * 1.5;
        c.kneeL.rotation.x = Math.max(0, Math.sin(t)) * cfg.legSwing * 1.5;
        
        // 4. Arm Swing (opposing legs)
        const armWeight = this.weaponPose ? 0.2 : 1.0;
        c.shoulderR.rotation.x = -Math.sin(t) * cfg.armSwing * armWeight;
        c.shoulderL.rotation.x = Math.sin(t) * cfg.armSwing * armWeight;

        // 5. Secondary Motion (Head Bob)
        c.neck.rotation.x = Math.sin(t * 2) * 0.05;
        c.neck.rotation.y = Math.sin(t) * 0.02;

        if (cfg.lean) {
            c.spine.rotation.x = cfg.lean;
        }
    }
    
    // Weapon attachment helper
    setWeaponPose(weaponType) {
        this.weaponPose = weaponType;
        const c = this.character;
        
        // Tactical "Chest Level" Hold
        // Right Arm (Trigger finger arm)
        c.shoulderR.rotation.set(-0.6, -0.4, 0); // Tucked in
        c.elbowR.rotation.set(0, -1.2, 0);       // Bent significantly (90 deg)
        c.handR.rotation.set(0.2, 0, 0);
        
        // Left Arm (Support hand)
        c.shoulderL.rotation.set(-0.8, 0.6, 0);  // Reaching across
        c.elbowL.rotation.set(-1.0, 0, 0);       // Bent to support handguard
        c.handL.rotation.set(0.4, 0, 0);
    }
}

export default ProceduralAnimator;
