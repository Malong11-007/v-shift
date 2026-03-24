import { WEAPONS } from '../weapons/WeaponData.js';
import collision from '../physics/Collision.js';
import engine from '../core/Engine.js';
import viewModel from '../models/WeaponViewModel.js';
import audioManager from '../core/AudioManager.js';
import input from '../core/InputManager.js';
import BulletTracer from '../game/BulletTracer.js';
import * as THREE from 'three';
import networkManager from '../net/NetworkManager.js';
import { MSG } from '../net/NetMessages.js';
import RemotePlayer from './RemotePlayer.js';

export default class WeaponSystem {
    constructor(player) {
        this.player = player;
        this.camera = player.camera;
        
        this.loadout = [
            WEAPONS.V44SABRE, // Primary
            WEAPONS.SIDEARM,  // Secondary
            WEAPONS.KNIFE     // Melee
        ];
        
        this.currentSlot = 0;
        this.currentWeapon = this.loadout[0];
        
        // Ammo tracking: { [weapon.id]: currentAmmoInMag }
        this.ammo = {};
        this.loadout.forEach(w => {
            if (w.magSize) this.ammo[w.id] = w.magSize;
        });

        // State tracking
        this.lastFireTime = 0;
        this.isReloading = false;
        
        // Recoil tracking for recovery
        this.recoilOffsetPitch = 0;
        this.recoilOffsetYaw = 0;

        window.addEventListener('onWeaponSwitch', (e) => this.switchWeapon(e.detail - 1));
        window.addEventListener('playerFired', this.fire.bind(this));
        
        // Equip first weapon visually
        setTimeout(() => this.switchWeapon(0), 100);
    }

    switchWeapon(slotIndex) {
        if (slotIndex < 0 || slotIndex >= this.loadout.length) return;
        
        this.currentSlot = slotIndex;
        this.currentWeapon = this.loadout[slotIndex];
        this.isReloading = false; // Cancel reload
        
        // Visual equip
        viewModel.equip(this.currentWeapon.id);
        
        // Sync HUD
        this.syncAmmo();
        
        // Apply move speed multiplier to player
        this.player.kineticEngine.maxSpeed = 12.0 * this.player.archetype.maxSpeedMod * this.currentWeapon.moveSpeedMultiplier;
        
        console.log('Switched to:', this.currentWeapon.name);
        window.dispatchEvent(new CustomEvent('weaponChanged', { detail: this.currentWeapon }));
    }

    fire() {
        if (this.isReloading) return;
        
        const now = performance.now() / 1000;
        if (now - this.lastFireTime < this.currentWeapon.fireRate) return;
        
        // Check ammo
        if (this.currentWeapon.type !== 'melee') {
            if (this.ammo[this.currentWeapon.id] <= 0) {
                // Auto reload if empty and trying to fire
                this.reload();
                return;
            }
            this.ammo[this.currentWeapon.id]--;
            this.syncAmmo();
        }
        
        this.lastFireTime = now;

        // Perform raycast
        if (this.currentWeapon.id === 'BREACH12') {
            this.fireShotgun();
        } else if (this.currentWeapon.id === 'KNIFE') {
            this.fireMelee();
        } else {
            this.fireHitscan();
        }

        // Apply Recoil
        this.applyRecoil();
        
        // Play weapon-specific SFX
        const sfxMap = {
            'V44SABRE': 'shoot_rifle',
            'BOLT88': 'shoot_sniper',
            'CINCH9': 'shoot_smg',
            'BREACH12': 'shoot_shotgun',
            'SIDEARM': 'shoot_pistol',
            'KNIFE': 'shoot_melee'
        };
        audioManager.playSyntheticSfx(sfxMap[this.currentWeapon.id] || 'shoot_rifle');
        
        // Dispatch effects event
        window.dispatchEvent(new CustomEvent('weaponFired', { detail: this.currentWeapon }));
    }

    fireHitscan() {
        const origin = new THREE.Vector3();
        this.camera.getWorldPosition(origin);
        
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);

        if (networkManager.connected) {
            networkManager.send(MSG.PLAYER_SHOOT, {
                x: origin.x, y: origin.y, z: origin.z,
                dx: direction.x, dy: direction.y, dz: direction.z,
                weaponId: this.currentWeapon.id
            });
        }

        // Exclude the player's own collider so we don't hit ourselves
        const excludeCol = this.player.collider || null;
        const hitResult = collision.castRay({ x: origin.x, y: origin.y, z: origin.z }, { x: direction.x, y: direction.y, z: direction.z }, 1000, excludeCol);
        
        if (hitResult) {
            this.processHit(hitResult, direction);
            // Bullet tracer
            BulletTracer.create(origin, hitResult.point);
        }
    }

    fireShotgun() {
        const origin = new THREE.Vector3();
        this.camera.getWorldPosition(origin);
        
        const excludeCol = this.player.collider || null;
        // Fixed cone pattern matching weapon pellet count
        const angles = [
            [0,0], [0.02,0], [-0.02,0], [0,0.02], [0,-0.02], [0.015,0.015], [-0.015,0.015], [0.015,-0.015]
        ];

        for (let i = 0; i < angles.length; i++) {
            const spreadQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(angles[i][1], angles[i][0], 0));
            const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion).applyQuaternion(spreadQuat);
            
            const hitResult = collision.castRay({ x: origin.x, y: origin.y, z: origin.z }, { x: direction.x, y: direction.y, z: direction.z }, 1000, excludeCol);
            if (hitResult) {
                this.processHit(hitResult, direction);
            }
        }
    }

    fireMelee() {
        const origin = new THREE.Vector3();
        this.camera.getWorldPosition(origin);
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);

        const excludeCol = this.player.collider || null;
        const hitResult = collision.castRay({ x: origin.x, y: origin.y, z: origin.z }, { x: direction.x, y: direction.y, z: direction.z }, this.currentWeapon.range, excludeCol);
        
        if (hitResult) {
            // Check if we hit an entity
            if (hitResult.collider) {
                const entity = collision.colliderMap.get(hitResult.collider.handle);
                if (entity && entity.takeDamage) {
                    const damage = this.currentWeapon.damage.slash;
                    const oldHealth = entity.health;
                    entity.takeDamage(damage, false, {
                        weaponId: this.currentWeapon.id,
                        hitDirection: direction
                    });
                    console.log(`Melee hit entity for ${damage} damage`);
                    window.dispatchEvent(new CustomEvent('hitMarker', { detail: { type: 'body', damage } }));

                    // Dispatch kill event if fatal
                    if (oldHealth > 0 && entity.health <= 0) {
                        const ke = this.player.kineticEngine;
                        window.dispatchEvent(new CustomEvent('playerKilled', {
                            detail: {
                                weaponId: this.currentWeapon.id,
                                isHeadshot: false,
                                victimId: entity.id || 'Unknown',
                                killerIsLocal: true,
                                killerSliding: ke.isSliding,
                                killerAirborne: !ke.isGrounded,
                                bhopChain: ke.consecutiveJumps
                            }
                        }));
                    }
                    return;
                }
            }
            // Hit geometry, not an entity
            const damage = this.currentWeapon.damage.slash;
            console.log(`Melee hit geometry for ${damage} damage`);
            window.dispatchEvent(new CustomEvent('hitMarker', { detail: { type: 'wall', damage: 0 } }));
        }
    }

    processHit(hitResult, direction = new THREE.Vector3(0, 0, -1)) {
        // Default headshot classification: 20% base chance on map geometry
        let isHeadshot = Math.random() < 0.2; 
        
        let hitEntity = false;
        
        // If we hit a registered entity (like a Bot or another Player)
        if (hitResult.collider) {
            const entity = collision.colliderMap.get(hitResult.collider.handle);
            if (entity && entity.takeDamage) {
                // If the hit point is very high on the capsule, it's a headshot
                isHeadshot = hitResult.point.y > entity.group.position.y + 0.8;
                
                // Calculate damage based on hit type
                const damage = isHeadshot ? this.currentWeapon.damage.head : this.currentWeapon.damage.body;
                const oldHealth = entity.health;
                
                // Broadcast hit to network
                if (networkManager.connected && entity instanceof RemotePlayer) {
                    networkManager.send(MSG.PLAYER_HIT, {
                        victimId: entity.id,
                        damage,
                        isHeadshot,
                        weaponId: this.currentWeapon.id,
                        hitDirection: { x: direction.x, y: direction.y, z: direction.z }
                    });
                }
                
                // Pass context so entity knows how to ragdoll
                entity.takeDamage(damage, isHeadshot, {
                    weaponId: this.currentWeapon.id,
                    hitDirection: direction
                });
                hitEntity = true;
                
                console.log(`Hit Entity! Type: ${isHeadshot ? 'Headshot' : 'Body'}, Dmg: ${damage}`);
                window.dispatchEvent(new CustomEvent('hitMarker', { detail: { type: isHeadshot ? 'head' : 'body', damage } }));
                
                // Dispatch kill event if fatal
                if (oldHealth > 0 && entity.health <= 0) {
                    const ke = this.player.kineticEngine;
                    window.dispatchEvent(new CustomEvent('playerKilled', {
                        detail: {
                            weaponId: this.currentWeapon.id,
                            isHeadshot: isHeadshot,
                            victimId: entity.id || 'Unknown',
                            killerIsLocal: true,
                            killerSliding: ke.isSliding,
                            killerAirborne: !ke.isGrounded,
                            bhopChain: ke.consecutiveJumps
                        }
                    }));
                }
            }
        }
        
        if (!hitEntity) {
            // Hit a wall — no damage to entities, just visual feedback
            console.log(`Hit geometry.`);
            window.dispatchEvent(new CustomEvent('hitMarker', { detail: { type: 'wall', damage: 0 } }));
        }
    }

    applyRecoil() {
        // Kick camera up and slightly varied left/right
        const kickY = this.currentWeapon.recoilY; // Upward pitch
        const kickX = (Math.random() - 0.5) * this.currentWeapon.recoilX; // Horizontal yaw
        
        this.player.pitch += kickY;
        this.player.yaw += kickX;
        
        // Accumulate to recover later
        this.recoilOffsetPitch += kickY;
        this.recoilOffsetYaw += kickX;
    }

    reload() {
        if (this.isReloading || this.currentWeapon.type === 'melee' || this.ammo[this.currentWeapon.id] === this.currentWeapon.magSize) {
            return;
        }
        
        this.isReloading = true;
        console.log(`Reloading ${this.currentWeapon.name}...`);
        
        window.dispatchEvent(new CustomEvent('weaponReloading', { detail: this.currentWeapon.reloadTime }));

        setTimeout(() => {
            if (this.isReloading) {
                this.ammo[this.currentWeapon.id] = this.currentWeapon.magSize;
                this.isReloading = false;
                console.log('Reload complete.');
                this.syncAmmo();
            }
        }, this.currentWeapon.reloadTime * 1000);
    }

    syncAmmo() {
        if (this.currentWeapon.type === 'melee') return;
        window.dispatchEvent(new CustomEvent('weaponAmmoSync', { 
            detail: { current: this.ammo[this.currentWeapon.id], max: this.currentWeapon.magSize } 
        }));
    }

    update(delta, mouseDelta) {
        // 1. Recoil recovery
        const now = performance.now() / 1000;
        if (now - this.lastFireTime > 0.1 && (this.recoilOffsetPitch > 0 || Math.abs(this.recoilOffsetYaw) > 0)) {
            const recoveryRatio = 10 * delta; 
            const recoverP = this.recoilOffsetPitch * recoveryRatio;
            const recoverY = this.recoilOffsetYaw * recoveryRatio;
            
            this.player.pitch -= recoverP;
            this.player.yaw -= recoverY;
            this.recoilOffsetPitch -= recoverP;
            this.recoilOffsetYaw -= recoverY;
            
            if (this.recoilOffsetPitch < 0.001) this.recoilOffsetPitch = 0;
            if (Math.abs(this.recoilOffsetYaw) < 0.001) this.recoilOffsetYaw = 0;
        }

        // 2. Update View Model (Sway & Bob)
        const velocity = this.player.getVelocity ? this.player.getVelocity() : { x: 0, y: 0, z: 0 };
        viewModel.update(delta, mouseDelta, velocity);
    }
}
