import * as THREE from 'three';
import engine from '../core/Engine.js';
import physics from '../physics/PhysicsWorld.js';
import input from '../core/InputManager.js';
import collision from '../physics/Collision.js';
import KineticEngine from '../physics/KineticEngine.js';
import { ARCHETYPES } from '../archetypes/ArchetypeData.js';
import WeaponSystem from '../entities/WeaponSystem.js';
import gameState, { STATES } from '../core/GameState.js';
import { GrenadeManager } from '../entities/Grenade.js';
import viewModel from '../models/WeaponViewModel.js';
import networkManager from '../net/NetworkManager.js';
import { MSG } from '../net/NetMessages.js';
import RemotePlayer from '../entities/RemotePlayer.js';

export default class Player {
    constructor() {
        this.camera = engine.camera;
        this.body = null;
        this.kineticEngine = null;
        
        // Stats
        this.health = 100;
        this.isAlive = true;
        this.archetype = ARCHETYPES.KINETIC; // Default
        
        // Mouse look properties
        this.yaw = 0;
        this.pitch = 0;
        this.sensitivity = 2.0; // Can be updated from settings
        
        // Network state
        this.lastNetUpdate = 0;
        this.remotePlayers = new Map(); // id -> RemotePlayer instance
        this.initNetworkListeners();
        
        // Create physics body (x, y, z, halfHeight, radius)
        this.capsulePadding = 0.1;
        const capsule = physics.createPlayerCapsule(10, 5, 10, 0.6, 0.3);
        this.body = capsule.body;
        this.collider = capsule.collider;
        
        // Initialize movement engine
        this.kineticEngine = new KineticEngine(this.body, this.camera);
        
        // Initialize weapon system
        this.weaponSystem = new WeaponSystem(this);
        
        this.applyArchetype(this.archetype);
        
        // Initialize grenade manager
        this.grenadeManager = new GrenadeManager(this);
        
        // Initialize first-person weapon viewmodel
        viewModel.init(this.camera);
        viewModel.equip(this.weaponSystem.currentWeapon.id);
        
        // Bind input events
        window.addEventListener('onShootPrimary', this.handleShoot.bind(this));
        window.addEventListener('onReload', () => this.weaponSystem.reload());
        window.addEventListener('playerTakeDamage', (e) => {
            if (gameState.currentState !== STATES.PLAYING) return;
            this.takeDamage(e.detail.amount, false, { killerPos: e.detail.killerPos });
        });
        
        // Escape key for pause menu
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Escape') {
                if (gameState.currentState === STATES.PLAYING) {
                    gameState.transition(STATES.PAUSED);
                    if (document.pointerLockElement) document.exitPointerLock();
                } else if (gameState.currentState === STATES.PAUSED) {
                    gameState.transition(STATES.PLAYING);
                }
            }
        });
        
        // Dispatch initial health
        window.dispatchEvent(new CustomEvent('playerHealthChanged', { detail: this.health }));
        
        // Listen for settings changes
        window.addEventListener('sensitivityChanged', (e) => { this.sensitivity = e.detail; });
        window.addEventListener('fovChanged', (e) => {
            this.camera.fov = e.detail;
            this.camera.updateProjectionMatrix();
        });
        
        // Load saved settings
        try {
            const saved = JSON.parse(localStorage.getItem('vshift_settings') || '{}');
            if (saved.sensitivity) this.sensitivity = saved.sensitivity;
            if (saved.fov) {
                this.camera.fov = saved.fov;
                this.camera.updateProjectionMatrix();
            }
        } catch {}
    }

    applyArchetype(archetype) {
        this.archetype = archetype;
        if (this.kineticEngine) {
            this.kineticEngine.bhopWindow = archetype.bhopWindow;
            this.kineticEngine.maxSpeed = 12.0 * archetype.maxSpeedMod;
        }
    }

    handleShoot() {
        if (!this.isAlive || !input.isInputActive()) return;
        // The WeaponSystem will actually handle guns/damage, but for now we dispatch an event
        window.dispatchEvent(new CustomEvent('playerFired'));
    }

    takeDamage(amount, isHeadshot, context = {}) {
        if (!this.isAlive) return;
        
        this.lastDamageContext = { ...context, isHeadshot };
        this.health -= amount;
        
        // Apply flinch
        const flinchAmount = (amount / 100) * this.archetype.flinchMultiplier;
        this.pitch += (Math.random() - 0.5) * flinchAmount;
        this.yaw += (Math.random() - 0.5) * flinchAmount;
        
        // Broadcast hit to network if we hit someone (handled in WeaponSystem)
        // This method handles when WE take damage.
        
        if (this.health <= 0) {
            this.health = 0;
            this.die();
            
            if (networkManager.connected) {
                networkManager.send(MSG.PLAYER_DIED, {
                    killerId: context.killerId || null,
                    weaponId: context.weaponId || null,
                    isHeadshot
                });
            }
        }
        
        window.dispatchEvent(new CustomEvent('playerHealthChanged', { detail: this.health }));
        window.dispatchEvent(new CustomEvent('playerHit', { 
            detail: { health: this.health, amount, isHeadshot, context } 
        }));
    }

    die() {
        this.isAlive = false;
        
        // Drop physics body
        this.body.setTranslation({ x: -1000, y: -1000, z: -1000 }, true);
        
        // Death Camera Effect (7b.5)
        engine.timeScale = 0.2; // Slow-mo
        
        // Camera effect: look at killer or fall down
        this.deathCamPos = this.body.translation();
        const killerPos = (this.lastDamageContext && this.lastDamageContext.killerPos) 
            ? this.lastDamageContext.killerPos 
            : new THREE.Vector3(0, this.deathCamPos.y, 0);

        this.deathCamTarget = killerPos;
        
        // Dispatch death event
        window.dispatchEvent(new CustomEvent('playerKilled', {
            detail: {
                victimId: 'local',
                killerId: this.lastDamageContext.killerId,
                weaponId: this.lastDamageContext.weaponId,
                isHeadshot: this.lastDamageContext.isHeadshot
            }
        }));
        
        // Temporary auto-respawn
        setTimeout(() => this.respawn(), 3000);
    }

    respawn(spawnPoints = [{x: 10, y: 5, z: 10}]) {
        // Pick random spawn
        const spawn = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
        
        this.health = 100;
        this.isAlive = true;
        
        // Reset camera effects
        engine.timeScale = 1.0;
        
        // Reset physics
        this.body.setTranslation(spawn, true);
        this.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
        
        this.yaw = 0;
        this.pitch = 0;
        
        window.dispatchEvent(new CustomEvent('playerRespawned'));
        
        if (networkManager.connected) {
            networkManager.send(MSG.PLAYER_RESPAWN, { x: spawn.x, y: spawn.y, z: spawn.z });
        }
    }

    initNetworkListeners() {
        networkManager.on(MSG.PLAYER_STATE, (data) => {
            let rp = this.remotePlayers.get(data.playerId);
            if (!rp) {
                rp = new RemotePlayer(data.playerId, data.playerName || 'Guest');
                this.remotePlayers.set(data.playerId, rp);
            }
            rp.pushSnapshot(data);
        });

        networkManager.on(MSG.PLAYER_SHOOT, (data) => {
            const rp = this.remotePlayers.get(data.playerId);
            if (rp) {
                // Play remote shoot effects here if needed
                window.dispatchEvent(new CustomEvent('remoteShoot', { detail: data }));
            }
        });

        networkManager.on(MSG.PLAYER_HIT, (data) => {
            // If WE are the victim
            if (data.victimId === networkManager.playerId || data.victimId === this.id) {
                this.takeDamage(data.damage, data.isHeadshot, {
                    killerId: data.playerId,
                    weaponId: data.weaponId,
                    hitDirection: new THREE.Vector3(data.hitDirection.x, data.hitDirection.y, data.hitDirection.z)
                });
            } else {
                // Someone else was hit, update their RemotePlayer local state if we want
                const rp = this.remotePlayers.get(data.victimId);
                if (rp) rp.takeDamage(data.damage, data.isHeadshot);
            }
        });

        networkManager.on(MSG.PLAYER_DIED, (data) => {
            const rp = this.remotePlayers.get(data.victimId);
            if (rp) {
                rp.die();
                // Add to kill feed
                window.dispatchEvent(new CustomEvent('killFeed', { detail: data }));
            }
        });

        networkManager.on(MSG.PLAYER_LEFT, (data) => {
            const rp = this.remotePlayers.get(data.playerId);
            if (rp) {
                rp.destroy();
                this.remotePlayers.delete(data.playerId);
            }
        });
    }

    getVelocity() {
        if (!this.body) return { x: 0, y: 0, z: 0 };
        return this.body.linvel();
    }

    update(delta) {
        // Network 20Hz update
        if (this.isAlive && networkManager.connected && gameState.currentState === STATES.PLAYING) {
            this.lastNetUpdate += delta;
            if (this.lastNetUpdate >= 0.05) { // 20Hz
                const pos = this.body.translation();
                networkManager.send(MSG.PLAYER_STATE, {
                    x: pos.x, y: pos.y, z: pos.z,
                    yaw: this.yaw,
                    weaponId: this.weaponSystem.currentWeapon.id
                });
                this.lastNetUpdate = 0;
            }
        }

        if (!this.isAlive) {
            // Death Cam update
            if (this.deathCamPos && this.deathCamTarget) {
                // Pull back slightly and look at killer
                const dir = new THREE.Vector3().subVectors(this.deathCamPos, this.deathCamTarget);
                dir.y = 0; // Keep horizontal pull mostly
                dir.normalize();
                
                // Make sure we aren't at the exact same spot (e.g. killed by self/fall)
                if (dir.lengthSq() < 0.1) dir.set(0, 0, 1);

                this.camera.position.addScaledVector(dir, 2.0 * delta); // Move backwards from killer
                this.camera.position.y += 1.0 * delta; // Move up
                this.camera.lookAt(this.deathCamTarget);
            }
            return;
        }

        // 1. Mouse Look (includes gamepad + touch look)
        const mouseDelta = input.getMouseDelta();
        if (input.isInputActive()) {
            // Increased sensitivity for snappier feel
            this.yaw -= mouseDelta.x * this.sensitivity * 0.002;
            this.pitch -= mouseDelta.y * this.sensitivity * 0.002;

            // Clamp pitch to ±89 degrees
            const maxPitch = Math.PI / 2 - 0.01;
            this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
        }

        // Apply rotation to camera
        const euler = new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ');
        this.camera.quaternion.setFromEuler(euler);

        // 2. Ground Detection using Collision
        const pos = this.body.translation();
        const playerPos = new THREE.Vector3(pos.x, pos.y, pos.z);
        
        // 0.6 is capsule halfHeight, 0.3 is radius. Total center offset to bottom is ~0.9.
        const hitGrounded = collision.isGrounded(playerPos, 0.9 + this.capsulePadding);
        this.kineticEngine.setGrounded(hitGrounded);

        // 3. Update movement physics via KineticEngine
        this.kineticEngine.update(delta);

        // 4. Update Weapon System (for recoil recovery & sway)
        this.weaponSystem.update(delta, mouseDelta);

        // 5. Sync camera position to physics body (eye level)
        // Typically eye level is near the top of the capsule
        this.camera.position.set(pos.x, pos.y + 0.6, pos.z);
    }
}
