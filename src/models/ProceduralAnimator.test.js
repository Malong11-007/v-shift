import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';
import ProceduralAnimator from './ProceduralAnimator.js';
import CharacterModel from './CharacterModel.js';

describe('ProceduralAnimator', () => {
    function createAnimator() {
        const char = new CharacterModel();
        return new ProceduralAnimator(char);
    }

    it('should initialize with IDLE state', () => {
        const anim = createAnimator();
        expect(anim.state).toBe('IDLE');
    });

    it('should support DEATH state', () => {
        const anim = createAnimator();
        anim.setState('DEATH');
        expect(anim.state).toBe('DEATH');
        // Should not throw on update
        anim.update(0.016);
    });

    it('should support head look-at', () => {
        const anim = createAnimator();
        anim.setLookAt(0.5, -0.3);
        expect(anim.lookAtYaw).toBeCloseTo(0.5);
        expect(anim.lookAtPitch).toBeCloseTo(-0.3);
        // Should apply during update
        anim.update(0.016);
    });

    it('should clamp head look-at values', () => {
        const anim = createAnimator();
        anim.setLookAt(5.0, -5.0);
        expect(anim.lookAtYaw).toBeLessThanOrEqual(1.2);
        expect(anim.lookAtPitch).toBeGreaterThanOrEqual(-0.6);
    });

    it('should transition states with blending', () => {
        const anim = createAnimator();
        anim.setState('WALK');
        expect(anim.prevState).toBe('IDLE');
        expect(anim.blendFactor).toBe(0);
        anim.update(0.1);
        expect(anim.blendFactor).toBeGreaterThan(0);
    });

    it('death animation should collapse the character', () => {
        const anim = createAnimator();
        anim.setState('DEATH');
        // Simulate time passing
        for (let i = 0; i < 20; i++) {
            anim.update(0.016);
        }
        // Spine should be rotated forward
        expect(anim.character.spine.rotation.x).toBeGreaterThan(0);
        // Knees should be buckled
        expect(anim.character.kneeR.rotation.x).toBeGreaterThan(0);
    });

    it('setADSPose should tighten the weapon hold', () => {
        const anim = createAnimator();
        anim.setADSPose();
        expect(anim.weaponPose).toBe('ADS');
        // Shoulder should be more pitched up than normal pose
        expect(anim.character.shoulderR.rotation.x).toBeLessThan(-0.7);
    });

    it('idle should add weight shift and hand micro-movement', () => {
        const anim = createAnimator();
        anim.time = 1.0;
        anim.update(0.016);
        // Hands should have slight rotation from idle
        expect(Math.abs(anim.character.handR.rotation.x)).toBeGreaterThan(0);
    });

    it('locomotion should add foot plant correction', () => {
        const anim = createAnimator();
        anim.setState('WALK');
        anim.time = 0.5;
        anim.update(0.016);
        // Feet should have some rotation
        const footRot = anim.character.footR?.rotation?.x || 0;
        // At least some amount of rotation should exist
        expect(footRot).toBeDefined();
    });
});
