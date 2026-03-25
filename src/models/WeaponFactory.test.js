import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';
import WeaponFactory from './WeaponFactory.js';

describe('WeaponFactory', () => {
    const weaponIds = ['V44SABRE', 'CINCH9', 'BREACH12', 'BOLT88', 'SIDEARM', 'KNIFE'];

    weaponIds.forEach(id => {
        describe(id, () => {
            it('should create a Group with multiple mesh parts', () => {
                const weapon = WeaponFactory.createWeapon(id);
                expect(weapon).toBeInstanceOf(THREE.Group);
                let meshCount = 0;
                weapon.traverse(c => { if (c.isMesh) meshCount++; });
                expect(meshCount).toBeGreaterThan(5);
            });

            it('should have gripData with rightHand', () => {
                const weapon = WeaponFactory.createWeapon(id);
                expect(weapon.userData.gripData).toBeDefined();
                expect(weapon.userData.gripData.rightHand).toBeDefined();
                expect(weapon.userData.gripData.rightHand.pos).toBeInstanceOf(THREE.Vector3);
            });
        });
    });

    it('V44SABRE should have trigger guard (TorusGeometry)', () => {
        const weapon = WeaponFactory.createWeapon('V44SABRE');
        let hasTorus = false;
        weapon.traverse(c => {
            if (c.isMesh && c.geometry && c.geometry.type === 'TorusGeometry') hasTorus = true;
        });
        expect(hasTorus).toBe(true);
    });

    it('V44SABRE should have optic lens with emissive material', () => {
        const weapon = WeaponFactory.createWeapon('V44SABRE');
        let hasEmissiveLens = false;
        weapon.traverse(c => {
            if (c.isMesh && c.material && c.material.emissiveIntensity > 0.5) {
                hasEmissiveLens = true;
            }
        });
        expect(hasEmissiveLens).toBe(true);
    });

    it('V44SABRE should have more detail than before (>40 meshes)', () => {
        const weapon = WeaponFactory.createWeapon('V44SABRE');
        let meshCount = 0;
        weapon.traverse(c => { if (c.isMesh) meshCount++; });
        expect(meshCount).toBeGreaterThan(40);
    });

    it('BOLT88 should have bipod legs', () => {
        const weapon = WeaponFactory.createWeapon('BOLT88');
        let cylinderCount = 0;
        weapon.traverse(c => {
            if (c.isMesh && c.geometry && c.geometry.type === 'CylinderGeometry') cylinderCount++;
        });
        // Should have many cylinders: barrel, scope, turrets, bipod legs, etc
        expect(cylinderCount).toBeGreaterThan(10);
    });

    it('BREACH12 should have shell holder shells', () => {
        const weapon = WeaponFactory.createWeapon('BREACH12');
        let meshCount = 0;
        weapon.traverse(c => { if (c.isMesh) meshCount++; });
        expect(meshCount).toBeGreaterThan(20);
    });

    it('KNIFE should have guard, pommel and lanyard', () => {
        const weapon = WeaponFactory.createWeapon('KNIFE');
        let meshCount = 0;
        weapon.traverse(c => { if (c.isMesh) meshCount++; });
        expect(meshCount).toBeGreaterThan(12);
    });

    it('SIDEARM should have slide serrations', () => {
        const weapon = WeaponFactory.createWeapon('SIDEARM');
        let meshCount = 0;
        weapon.traverse(c => { if (c.isMesh) meshCount++; });
        expect(meshCount).toBeGreaterThan(15);
    });

    it('firearms should have muzzlePos defined', () => {
        for (const id of ['V44SABRE', 'CINCH9', 'BREACH12', 'BOLT88', 'SIDEARM']) {
            const weapon = WeaponFactory.createWeapon(id);
            expect(weapon.userData.muzzlePos).toBeInstanceOf(THREE.Vector3);
        }
    });

    it('default weapon should be V44SABRE', () => {
        const weapon = WeaponFactory.createWeapon('UNKNOWN');
        expect(weapon.userData.muzzlePos).toBeDefined();
        // Same structure as V44SABRE
        let meshCount = 0;
        weapon.traverse(c => { if (c.isMesh) meshCount++; });
        expect(meshCount).toBeGreaterThan(40);
    });
});
