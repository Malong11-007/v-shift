import * as THREE from 'three';
import physics from '../physics/PhysicsWorld.js';
import collision from '../physics/Collision.js';
import arena from '../world/Arena.js';
import engine from '../core/Engine.js';
import audioManager from '../core/AudioManager.js';
import gameState, { STATES } from '../core/GameState.js';
import roundManager, { ROUND_STATES } from '../game/RoundManager.js';
import CharacterModel from '../models/CharacterModel.js';
import ProceduralAnimator from '../models/ProceduralAnimator.js';
import WeaponFactory from '../models/WeaponFactory.js';
import Ragdoll from '../game/Ragdoll.js';

export const BOT_STATES = {
    PATROL: 'PATROL',
    CHASE: 'CHASE',
    ATTACK: 'ATTACK',
    DEAD: 'DEAD'
};

export const BOT_TEAMS = {
    ATTACKERS: 'ATTACKERS',
    DEFENDERS: 'DEFENDERS'
};

export default class Bot {
    constructor(id, startPos, team = BOT_TEAMS.DEFENDERS) {
        this.id = id;
        this.team = team;
        this.state = BOT_STATES.PATROL;
        this.health = 100;
        this.speed = 3.0; // Slower than player
        this.lastShotTime = 0;
        this.fireRate = 400; // ms
        this.spawnProtectionUntil = performance.now() + 2000;
        this.spawnPos = new THREE.Vector3().copy(startPos);

        // Visuals
        this.group = new THREE.Group();
        this.group.position.copy(startPos);
        engine.scene.add(this.group);
        
        // Target tracking
        this.targetNode = null;
        this.playerTarget = null; // Set dynamically when player is in LOS

        this.initVisuals();
        this.initPhysics(startPos);
        this.createHealthBar();
        
        // Listen for round resets in competitive mode
        this._onRoundReset = () => this.resetForRound();
        window.addEventListener('roundReset', this._onRoundReset);
        
        // Register to engine loop
        engine.updatables.push(this);
    }

    createHealthBar() {
        // Canvas-based health bar sprite
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 16;
        this.hbCanvas = canvas;
        this.hbCtx = canvas.getContext('2d');
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
        this.healthSprite = new THREE.Sprite(spriteMat);
        this.healthSprite.scale.set(1.5, 0.15, 1);
        this.healthSprite.position.y = 2.2; // Above head
        this.group.add(this.healthSprite);
        
        this.updateHealthBar();
    }

    updateHealthBar() {
        if (!this.hbCtx) return;
        const ctx = this.hbCtx;
        const w = 128, h = 16;
        const pct = Math.max(0, this.health / 100);
        
        ctx.clearRect(0, 0, w, h);
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, w, h);
        
        // Health fill with color gradient
        if (pct > 0.5) ctx.fillStyle = '#00ff66';
        else if (pct > 0.25) ctx.fillStyle = '#ffaa00';
        else ctx.fillStyle = '#ff2244';
        
        ctx.fillRect(2, 2, (w - 4) * pct, h - 4);
        
        // Border
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 1;
        ctx.strokeRect(1, 1, w - 2, h - 2);
        
        if (this.healthSprite) {
            this.healthSprite.material.map.needsUpdate = true;
        }
    }

    async initVisuals() {
        try {
            // 1. Create the procedural character with team color
            const teamColor = this.team === BOT_TEAMS.ATTACKERS ? 0xaa3333 : 0x3366aa; // Red for attackers, blue for defenders
            this.character = new CharacterModel(teamColor);
            this.mesh = this.character.root;
            this.mesh.scale.set(1.3, 1.3, 1.3);
            this.group.add(this.mesh);

            // 2. Setup the animator
            this.animator = new ProceduralAnimator(this.character);

            // 3. Attach a weapon
            this.weapon = WeaponFactory.createWeapon('V44SABRE');
            this.character.weaponMount.add(this.weapon);
            this.animator.setWeaponPose('RIFLE');

            console.log(`[Bot ${this.id}] Procedural character initialized for team ${this.team}.`);
        } catch (e) {
            console.error(`[Bot ${this.id}] FATAL ERROR initializing procedural visuals:`, e);
            // Fallback capsule with team color
            const teamColor = this.team === BOT_TEAMS.ATTACKERS ? 0xaa3333 : 0x3366aa;
            const geo = new THREE.CapsuleGeometry(0.5, 1, 4, 8);
            const mat = new THREE.MeshStandardMaterial({ color: teamColor });
            this.mesh = new THREE.Mesh(geo, mat);
            this.mesh.position.y = 1.0;
            this.mesh.castShadow = true;
            this.mesh.receiveShadow = true;
            this.group.add(this.mesh);
        }
    }

    initPhysics(startPos) {
        if (!physics.world || !physics.RAPIER) return;
        
        const bodyDesc = physics.RAPIER.RigidBodyDesc.dynamic()
            .setTranslation(startPos.x, startPos.y + 1.0, startPos.z)
            .lockRotations();
            
        this.body = physics.world.createRigidBody(bodyDesc);
        
        const colliderDesc = physics.RAPIER.ColliderDesc.capsule(0.5, 0.5)
            .setMass(70)
            .setFriction(0.0)
            .setActiveEvents(physics.RAPIER.ActiveEvents.COLLISION_EVENTS);
            
        this.collider = physics.world.createCollider(colliderDesc, this.body);
        
        // Map the collider back to this bot for hitscan detection
        collision.colliderMap.set(this.collider.handle, this);
    }

    takeDamage(amount, isHeadshot, context = {}) {
        if (this.state === BOT_STATES.DEAD) return;
        
        this.lastDamageContext = context;
        this.health -= amount;
        
        // Juice: flash white
        if (this.mesh && this.mesh.traverse) {
            this.mesh.traverse((m) => {
                if (m.isMesh && m.material) {
                    m.material.emissive.setHex(0x555555);
                }
            });
            setTimeout(() => {
                if (this.mesh && this.mesh.traverse) {
                    this.mesh.traverse((m) => {
                        if (m.isMesh && m.material && m.userData.initialEmissive) {
                            m.material.emissive.copy(m.userData.initialEmissive);
                        }
                    });
                }
            }, 100);
        } else if (this.mesh && this.mesh.material) {
            // Fallback capsule
            const oldColor = this.mesh.material.color.getHex();
            this.mesh.material.color.setHex(0xffffff);
            setTimeout(() => {
                if (this.mesh) this.mesh.material.color.setHex(oldColor);
            }, 100);
        }

        if (this.health <= 0) {
            this.die();
        } else {
            // Instantly aggro to player if shot
            this.state = BOT_STATES.CHASE;
            this.updateHealthBar();
        }
    }

    die() {
        this.state = BOT_STATES.DEAD;
        
        // Remove physics
        if (this.body && physics.world) {
            physics.world.removeRigidBody(this.body);
            this.body = null;
        }
        
        // Wait, if we spawn a Ragdoll, we want to hide the original procedural mesh
        if (this.mesh) {
            this.mesh.visible = false;
        }
        if (this.weapon) {
            this.weapon.visible = false;
        }
        if (this.healthSprite) {
            this.healthSprite.visible = false;
        }

        // Spawn Ragdoll
        const dir = (this.lastDamageContext && this.lastDamageContext.hitDirection) 
            ? this.lastDamageContext.hitDirection 
            : new THREE.Vector3(0, 0, -1);
            
        // If killed by shotgun, multiply force
        const force = (this.lastDamageContext && this.lastDamageContext.weaponId === 'BREACH12') ? 2.5 : 1.0;
        
        this.ragdoll = new Ragdoll(this.group, dir, force);
        
        // In competitive rounds (LIVE state), stay dead until next round.
        // In other modes (deathmatch, etc.), auto-respawn after 5s.
        if (roundManager.state === ROUND_STATES.LIVE) {
            // Dead until roundReset event fires at next round start
            this.pendingRespawn = true;
        } else {
            setTimeout(() => this.respawn(), 5000);
        }
    }

    respawn() {
        this.health = 100;
        this.state = BOT_STATES.PATROL;
        this.spawnProtectionUntil = performance.now() + 2000;
        this.pendingRespawn = false;
        
        // Reset visuals
        if (this.mesh) this.mesh.visible = true;
        if (this.weapon) this.weapon.visible = true;
        if (this.healthSprite) this.healthSprite.visible = true;
        if (this.ragdoll) {
            this.ragdoll.destroy();
            this.ragdoll = null;
        }
        
        const point = arena.getBotSpawn();
        
        this.initPhysics(point);
        this.group.position.copy(point);
        this.updateHealthBar();
    }

    resetForRound() {
        // Called at the start of each new round to fully reset the bot
        this.respawn();
        // Move to original spawn position for consistent round starts
        const point = this.spawnPos;
        if (this.body && physics.world) {
            physics.world.removeRigidBody(this.body);
            this.body = null;
        }
        this.initPhysics(point);
        this.group.position.copy(point);
    }

    destroy() {
        window.removeEventListener('roundReset', this._onRoundReset);
        if (this.body && physics.world) {
            physics.world.removeRigidBody(this.body);
            this.body = null;
        }
        if (this.group && this.group.parent) {
            this.group.parent.remove(this.group);
        }
    }

    update(dt) {
        if (this.state === BOT_STATES.DEAD) return;
        if (!this.body) return;

        // Always sync visual to physics (so bots fall with gravity even on menus)
        const t = this.body.translation();
        this.group.position.set(t.x, t.y - 1.0, t.z);

        // Don't run AI unless the game is actively being played
        if (gameState.currentState !== STATES.PLAYING) return;
        if (roundManager.state !== ROUND_STATES.LIVE) return;

        if (!this.strafeTimer) this.strafeTimer = 0;
        this.strafeTimer += dt;

        // Find targets: player or enemy bots
        const targets = this.findTargets();
        if (targets.length === 0) {
            this.state = BOT_STATES.PATROL;
            this.playerTarget = null;
            return;
        }

        // Choose closest target
        let closestTarget = null;
        let closestDist = Infinity;

        for (const target of targets) {
            const dist = this.group.position.distanceTo(target.position);
            if (dist < closestDist) {
                closestDist = dist;
                closestTarget = target;
            }
        }

        if (!closestTarget) {
            this.state = BOT_STATES.PATROL;
            this.playerTarget = null;
            return;
        }

        // PERFORMANCE OPTIMIZATION: Skip expensive AI logic if target is too far
        if (closestDist > 35) {
            this.state = BOT_STATES.PATROL;
            return;
        }

        let hasLineOfSight = false;

        if (closestDist < 25) {
            // Check Line of Sight
            const dirToTarget = new THREE.Vector3().subVectors(closestTarget.position, this.group.position).normalize();
            const rayStart = { x: this.group.position.x, y: this.group.position.y + 0.5, z: this.group.position.z };
            const rayDir = { x: dirToTarget.x, y: dirToTarget.y, z: dirToTarget.z };

            const hit = collision.castRay(rayStart, rayDir, closestDist);
            if (hit && this.group.position.distanceTo(hit.point) < closestDist - 1.5) {
                hasLineOfSight = false;
            } else {
                hasLineOfSight = true;
            }
        }

        if (hasLineOfSight) {
            this.state = BOT_STATES.ATTACK;
            this.playerTarget = closestTarget.position;
            this.currentTarget = closestTarget;
        } else {
            this.state = BOT_STATES.PATROL;
            this.playerTarget = null;
            this.currentTarget = null;
        }

        // Apply velocities based on state
        const vel = { x: 0, y: this.body.linvel().y, z: 0 };

        if (this.state === BOT_STATES.ATTACK && this.playerTarget) {
            // Look at target
            const lookTarget = new THREE.Vector3(this.playerTarget.x, this.group.position.y, this.playerTarget.z);
            this.group.lookAt(lookTarget);

            // Move toward target + Strafe
            const dir = new THREE.Vector3().subVectors(this.playerTarget, this.group.position);
            dir.y = 0;
            dir.normalize();

            const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), dir).normalize();
            const strafeDir = Math.sin(this.strafeTimer * 2) > 0 ? 1 : -1;

            // Combination of closing distance and strafing
            if (closestDist > 12) {
                vel.x = (dir.x * 0.7 + right.x * strafeDir * 0.3) * this.speed;
                vel.z = (dir.z * 0.7 + right.z * strafeDir * 0.3) * this.speed;
            } else if (closestDist < 6) {
                vel.x = (-dir.x * 0.5 + right.x * strafeDir * 0.5) * this.speed;
                vel.z = (-dir.z * 0.5 + right.z * strafeDir * 0.5) * this.speed;
            } else {
                vel.x = (right.x * strafeDir) * this.speed * 0.8;
                vel.z = (right.z * strafeDir) * this.speed * 0.8;
            }

            // Shoot logic
            if (performance.now() >= this.spawnProtectionUntil && performance.now() - this.lastShotTime > this.fireRate) {
                this.shoot(closestDist);
                this.lastShotTime = performance.now();
                this.fireRate = 500 + Math.random() * 500;
            }
        }

        this.body.setLinvel(vel, true);

        // Update Animation State
        if (this.animator) {
            const speedSq = vel.x * vel.x + vel.z * vel.z;
            if (speedSq > 16.0) { // speed > 4
                this.animator.setState('RUN');
            } else if (speedSq > 0.25) { // speed > 0.5
                this.animator.setState('WALK');
            } else {
                this.animator.setState('IDLE');
            }
            this.animator.update(dt);
        }
    }

    findTargets() {
        const targets = [];

        // Check if player is alive and is an enemy
        if (window.localPlayer && window.localPlayer.isAlive) {
            // Player is on attacker team (opposite of defenders)
            const playerTeam = BOT_TEAMS.ATTACKERS;
            if (this.team !== playerTeam) {
                targets.push({
                    position: engine.camera.position,
                    entity: window.localPlayer,
                    type: 'player'
                });
            }
        }

        // Check all other bots
        if (window.bots) {
            for (const bot of window.bots) {
                if (bot === this) continue;
                if (bot.state === BOT_STATES.DEAD) continue;
                if (bot.team === this.team) continue; // Don't target teammates

                targets.push({
                    position: bot.group.position,
                    entity: bot,
                    type: 'bot'
                });
            }
        }

        return targets;
    }
    
    shoot(distToTarget) {
        audioManager.playSyntheticSfx('shoot_rifle');

        // Distance-based accuracy: closer = more accurate
        const basePct = 0.35;
        const distFactor = Math.max(0, 1 - (distToTarget / 25));
        const hitChance = 0.15 + (basePct * distFactor);

        if (Math.random() < hitChance) {
            // Hit! Deal damage
            const damage = 12 + Math.floor(Math.random() * 8); // 12-20 damage per hit

            if (this.currentTarget) {
                if (this.currentTarget.type === 'player') {
                    // Damage player
                    window.dispatchEvent(new CustomEvent('playerTakeDamage', {
                        detail: {
                            amount: damage,
                            killerPos: this.group.position.clone()
                        }
                    }));
                } else if (this.currentTarget.type === 'bot') {
                    // Damage other bot
                    const targetBot = this.currentTarget.entity;
                    if (targetBot && targetBot.takeDamage) {
                        const hitDirection = new THREE.Vector3()
                            .subVectors(targetBot.group.position, this.group.position)
                            .normalize();
                        targetBot.takeDamage(damage, false, {
                            weaponId: 'V44SABRE',
                            hitDirection: hitDirection
                        });
                    }
                }
            }
        }
    }
}
