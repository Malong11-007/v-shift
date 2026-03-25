import * as THREE from 'three';
import engine from '../core/Engine.js';
import WeaponFactory from '../models/WeaponFactory.js';
import gameState, { STATES } from '../core/GameState.js';
import input from '../core/InputManager.js';

/**
 * Modern First-Person Viewmodel System
 * Handles high-quality bob, sway, recoil, and weapon-specific grips.
 */
class WeaponViewModel {
    constructor() {
        this.camera = null;
        this.group = new THREE.Group();
        this.weaponGroup = new THREE.Group();
        this.armGroup = new THREE.Group();
        
        this.group.add(this.weaponGroup);
        this.group.add(this.armGroup);
        
        // Base Offset (Professional 'chest-level' position)
        this.viewOffset = new THREE.Vector3(0.12, -0.22, -0.32);
        this.group.position.copy(this.viewOffset);
        
        // Dynamic animation state
        this.currentPos = new THREE.Vector3().copy(this.viewOffset);
        this.targetPos = new THREE.Vector3().copy(this.viewOffset);
        
        this.swayAmount = 0.005; // Reduced from 0.015
        this.swaySmoothing = 12; // Smoother transitions
        this.bobAmount = 0.02;
        this.bobSpeed = 12;
        this.bobPhase = 0;
        
        this.recoilKick = 0;
        this.equipProgress = 1; 
        this.isEquipping = false;
        
        this.currentWeaponId = null;
        this.weapons = new Map();
        
        // Muzzle Flash
        this.muzzleFlash = this.createMuzzleFlash();
        this.muzzleFlashTimer = 0;

        // Initialize arms
        this.initArms();
        
        // Global listeners
        window.addEventListener('weaponFired', () => this.onFire());
    }

    init(camera) {
        this.camera = camera;
        camera.add(this.group);
        // Removed automatic engine update to prevent mouse delta competition
    }

    initArms() {
        const skinMat = new THREE.MeshStandardMaterial({ color: 0xd4a574, roughness: 0.7, metalness: 0.05 });
        const sleeveMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
        const gloveMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.85, metalness: 0.1 });
        const watchMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.3, metalness: 0.8 });
        const watchFaceMat = new THREE.MeshStandardMaterial({
            color: 0x002200, emissive: 0x003300, emissiveIntensity: 0.4, roughness: 0.1
        });
        
        // Right Arm
        this.rightArm = new THREE.Group();
        
        // Upper forearm (sleeved)
        const rForearmUpper = new THREE.Mesh(new THREE.CapsuleGeometry(0.028, 0.12, 6, 10), sleeveMat);
        rForearmUpper.position.y = -0.06;
        rForearmUpper.rotation.x = Math.PI / 2.5;
        this.rightArm.add(rForearmUpper);
        
        // Lower forearm (exposed skin)
        const rForearmLower = new THREE.Mesh(new THREE.CapsuleGeometry(0.025, 0.1, 6, 10), skinMat);
        rForearmLower.position.set(0, -0.04, 0.06);
        rForearmLower.rotation.x = Math.PI / 3;
        this.rightArm.add(rForearmLower);
        
        // Wrist
        const rWrist = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.022, 0.03, 10), skinMat);
        rWrist.position.set(0, -0.03, 0.09);
        this.rightArm.add(rWrist);
        
        // Gloved hand
        const rPalm = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.05, 0.04), gloveMat);
        rPalm.position.set(0, -0.04, 0.1);
        this.rightArm.add(rPalm);
        
        // Individual finger segments (4 fingers)
        for (let i = 0; i < 4; i++) {
            const finger = new THREE.Mesh(new THREE.BoxGeometry(0.009, 0.035, 0.012), gloveMat);
            finger.position.set(-0.013 + i * 0.009, -0.055, 0.12);
            finger.rotation.x = -0.2;
            this.rightArm.add(finger);
        }
        
        // Trigger finger (index — slightly forward)
        const triggerFinger = new THREE.Mesh(new THREE.BoxGeometry(0.009, 0.04, 0.012), gloveMat);
        triggerFinger.position.set(-0.013, -0.06, 0.125);
        triggerFinger.rotation.x = -0.4;
        this.rightArm.add(triggerFinger);
        
        // Thumb
        const rThumb = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.03, 0.012), gloveMat);
        rThumb.position.set(0.025, -0.04, 0.1);
        rThumb.rotation.z = -0.3;
        this.rightArm.add(rThumb);
        
        this.armGroup.add(this.rightArm);
        
        // Left Arm
        this.leftArm = new THREE.Group();
        
        const lForearmUpper = new THREE.Mesh(new THREE.CapsuleGeometry(0.028, 0.12, 6, 10), sleeveMat);
        lForearmUpper.position.y = -0.06;
        lForearmUpper.rotation.x = Math.PI / 2.1;
        lForearmUpper.rotation.z = 0.4;
        this.leftArm.add(lForearmUpper);
        
        const lForearmLower = new THREE.Mesh(new THREE.CapsuleGeometry(0.025, 0.1, 6, 10), skinMat);
        lForearmLower.position.set(0, -0.03, 0.06);
        lForearmLower.rotation.x = Math.PI / 2.5;
        lForearmLower.rotation.z = 0.3;
        this.leftArm.add(lForearmLower);
        
        // Wrist watch
        const watchBody = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.025, 0.02), watchMat);
        watchBody.position.set(0, -0.02, 0.08);
        this.leftArm.add(watchBody);
        
        const watchFace = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.018, 0.005), watchFaceMat);
        watchFace.position.set(0, -0.014, 0.08);
        this.leftArm.add(watchFace);
        
        const watchBand = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.008, 0.035), watchMat);
        watchBand.position.set(0, -0.025, 0.08);
        this.leftArm.add(watchBand);
        
        // Left hand (palm)
        const lPalm = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.035), gloveMat);
        lPalm.position.set(0, -0.03, 0.1);
        this.leftArm.add(lPalm);
        
        // Left fingers
        for (let i = 0; i < 4; i++) {
            const finger = new THREE.Mesh(new THREE.BoxGeometry(0.009, 0.03, 0.012), gloveMat);
            finger.position.set(-0.012 + i * 0.009, -0.045, 0.115);
            finger.rotation.x = -0.3;
            this.leftArm.add(finger);
        }
        
        // Left thumb
        const lThumb = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.025, 0.012), gloveMat);
        lThumb.position.set(0.024, -0.03, 0.1);
        lThumb.rotation.z = -0.3;
        this.leftArm.add(lThumb);
        
        this.armGroup.add(this.leftArm);
    }

    createMuzzleFlash() {
        const group = new THREE.Group();
        const light = new THREE.PointLight(0xffaa33, 4, 3);
        group.add(light);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
            color: 0xffcc44, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending
        }));
        sprite.scale.set(0.2, 0.2, 1);
        group.add(sprite);
        group.visible = false;
        this.group.add(group);
        return group;
    }

    equip(weaponId) {
        if (!weaponId || this.currentWeaponId === weaponId) return;
        
        // Hide previous
        if (this.currentWeaponId && this.weapons.has(this.currentWeaponId)) {
            this.weapons.get(this.currentWeaponId).visible = false;
        }
        
        this.currentWeaponId = weaponId;
        
        let weapon;
        if (this.weapons.has(weaponId)) {
            weapon = this.weapons.get(weaponId);
            weapon.visible = true;
        } else {
            weapon = WeaponFactory.createWeapon(weaponId);
            this.weapons.set(weaponId, weapon);
            this.weaponGroup.add(weapon);
        }
        
        // Move muzzle flash to current weapon's barrel position if defined
        if (weapon.userData.muzzlePos) {
            this.muzzleFlash.position.copy(weapon.userData.muzzlePos);
        } else {
            this.muzzleFlash.position.set(0, 0, 0.5); // Default
        }
        
        // Align arms to grip
        const grip = weapon.userData.gripData;
        if (grip) {
            console.log(`[WeaponViewModel] Equipping ${weaponId} with grip data.`);
            if (grip.rightHand) {
                this.rightArm.position.copy(grip.rightHand.pos);
                this.rightArm.visible = true;
            } else {
                this.rightArm.visible = false;
            }
            
            if (grip.leftHand) {
                this.leftArm.position.copy(grip.leftHand.pos);
                this.leftArm.visible = true;
            } else {
                this.leftArm.visible = false;
            }
        }

        // Trigger animation
        this.equipProgress = 0;
        this.isEquipping = true;
        
        // Ensure all components are visible and layered correctly
        this.group.traverse(child => {
            if (child.isMesh) {
                child.frustumCulled = false;
                child.renderOrder = 999;
                if (child.material) {
                    child.material.depthTest = false;
                    child.material.depthWrite = false;
                    child.material.transparent = true;
                }
            }
        });
    }

    onFire() {
        this.recoilKick = 0.05;
        if (this.currentWeaponId !== 'KNIFE') {
            this.muzzleFlash.visible = true;
            this.muzzleFlashTimer = 0.05;
            this.muzzleFlash.rotation.z = Math.random() * Math.PI * 2;
        }
    }

    update(dt, mouseDelta, velocity) {
        if (gameState.currentState !== STATES.PLAYING) {
            this.group.visible = false;
            return;
        }
        this.group.visible = true;

        // 1. Mouse Sway
        // mouseDelta is now passed in from WeaponSystem/Player
        if (mouseDelta) {
            this.targetPos.x = this.viewOffset.x - mouseDelta.x * this.swayAmount;
            this.targetPos.y = this.viewOffset.y + mouseDelta.y * this.swayAmount;
        }

        // 2. Pro Figure-Eight Bob
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
        
        if (speed > 0.1 && input.isLocked) {
            this.bobPhase += dt * this.bobSpeed;
            const intensity = this.bobAmount * (speed / 10);
            this.targetPos.x += Math.sin(this.bobPhase) * intensity * 0.8;
            this.targetPos.y += Math.abs(Math.sin(this.bobPhase * 2)) * intensity * 0.6;
            this.group.rotation.z = Math.sin(this.bobPhase) * 0.02;
        } else {
            this.bobPhase *= 0.9;
            this.group.rotation.z *= 0.9;
        }

        // 3. Equip Animation
        if (this.isEquipping) {
            this.equipProgress = Math.min(1, this.equipProgress + dt * 5);
            if (this.equipProgress >= 1) this.isEquipping = false;
        }
        const equipYOffset = (1 - this.equipProgress) * 0.4;

        // 4. Recoil Recovery
        this.recoilKick = Math.max(0, this.recoilKick - dt * 2.0);

        // Apply Position
        this.currentPos.lerp(this.targetPos, dt * this.swaySmoothing);
        this.group.position.set(
            this.currentPos.x,
            this.currentPos.y - equipYOffset - this.recoilKick,
            this.currentPos.z + this.recoilKick * 0.5
        );

        // 5. Rotation Sway
        this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, (this.viewOffset.x - this.currentPos.x) * 2, dt * this.swaySmoothing);
        this.group.rotation.x = THREE.MathUtils.lerp(this.group.rotation.x, (this.currentPos.y - this.viewOffset.y) * 2, dt * this.swaySmoothing);

        // Muzzle Flash Timer
        if (this.muzzleFlashTimer > 0) {
            this.muzzleFlashTimer -= dt;
            if (this.muzzleFlashTimer <= 0) this.muzzleFlash.visible = false;
        }
    }
}

const viewModel = new WeaponViewModel();
export default viewModel;
