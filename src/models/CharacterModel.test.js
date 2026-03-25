import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';
import CharacterModel from './CharacterModel.js';

describe('CharacterModel', () => {
    it('should create a root group with all skeletal joints', () => {
        const model = new CharacterModel();
        expect(model.root).toBeInstanceOf(THREE.Group);
        expect(model.hips).toBeDefined();
        expect(model.spine).toBeDefined();
        expect(model.chest).toBeDefined();
        expect(model.neck).toBeDefined();
        expect(model.head).toBeDefined();
        expect(model.shoulderR).toBeDefined();
        expect(model.shoulderL).toBeDefined();
        expect(model.elbowR).toBeDefined();
        expect(model.elbowL).toBeDefined();
        expect(model.handR).toBeDefined();
        expect(model.handL).toBeDefined();
        expect(model.legR).toBeDefined();
        expect(model.legL).toBeDefined();
        expect(model.kneeR).toBeDefined();
        expect(model.kneeL).toBeDefined();
        expect(model.footR).toBeDefined();
        expect(model.footL).toBeDefined();
        expect(model.weaponMount).toBeDefined();
    });

    it('should have significantly more meshes than the old model (detailed)', () => {
        const model = new CharacterModel();
        let meshCount = 0;
        model.root.traverse(c => { if (c.isMesh) meshCount++; });
        // Old model had ~20 meshes, new one should have 60+
        expect(meshCount).toBeGreaterThan(55);
    });

    it('should have tactical gear materials (vest, helmet, visor)', () => {
        const model = new CharacterModel();
        expect(model.vestMat).toBeInstanceOf(THREE.MeshStandardMaterial);
        expect(model.helmetMat).toBeInstanceOf(THREE.MeshStandardMaterial);
        expect(model.visorMat).toBeInstanceOf(THREE.MeshStandardMaterial);
        expect(model.visorMat.transparent).toBe(true);
        expect(model.visorMat.emissiveIntensity).toBeGreaterThan(0);
    });

    it('should accept custom team color', () => {
        const model = new CharacterModel(0xff0000);
        expect(model.clothesMat.color.getHex()).toBe(0xff0000);
    });

    it('all meshes should have shadow casting enabled', () => {
        const model = new CharacterModel();
        model.root.traverse(c => {
            if (c.isMesh) {
                expect(c.castShadow).toBe(true);
                expect(c.receiveShadow).toBe(true);
            }
        });
    });

    it('should have knee pads on both legs', () => {
        const model = new CharacterModel();
        // Knee pads are added as children of knee groups
        let kneeRChildren = 0;
        let kneeLChildren = 0;
        model.kneeR.traverse(c => { if (c.isMesh) kneeRChildren++; });
        model.kneeL.traverse(c => { if (c.isMesh) kneeLChildren++; });
        // Each knee should have lower leg + knee pad + knee pad center + ankle band
        expect(kneeRChildren).toBeGreaterThanOrEqual(4);
        expect(kneeLChildren).toBeGreaterThanOrEqual(4);
    });

    it('should have boots with soles and treads', () => {
        const model = new CharacterModel();
        let footRMeshes = 0;
        let footLMeshes = 0;
        model.footR.traverse(c => { if (c.isMesh) footRMeshes++; });
        model.footL.traverse(c => { if (c.isMesh) footLMeshes++; });
        // Boot upper + toe cap + sole + 4 treads + 3 laces = 10 each
        expect(footRMeshes).toBeGreaterThanOrEqual(8);
        expect(footLMeshes).toBeGreaterThanOrEqual(8);
    });
});
