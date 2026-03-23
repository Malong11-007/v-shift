import * as THREE from 'three';
import physics from '../physics/PhysicsWorld.js';
import engine from '../core/Engine.js';
import audioManager from '../core/AudioManager.js';
import gameState, { STATES } from '../core/GameState.js';
import input from '../core/InputManager.js';

const GRENADE_TYPES = {
    FLASH: 'FLASH',
    SMOKE: 'SMOKE',
    KINETIC: 'KINETIC'
};

const GRENADE_CONFIG = {
    [GRENADE_TYPES.FLASH]: {
        color: 0xffffff,
        fuseTime: 1.5,
        effectRadius: 15,
        name: 'FLASH'
    },
    [GRENADE_TYPES.SMOKE]: {
        color: 0x888888,
        fuseTime: 1.0,
        effectRadius: 5,
        duration: 8.0,
        name: 'SMOKE'
    },
    [GRENADE_TYPES.KINETIC]: {
        color: 0xff6600,
        fuseTime: 2.0,
        effectRadius: 8,
        force: 25,
        name: 'KINETIC'
    }
};

export default class Grenade {
    constructor(type, origin, direction, throwForce = 18) {
        this.type = type;
        this.config = GRENADE_CONFIG[type];
        this.alive = true;
        this.fuseTimer = this.config.fuseTime;
        
        // Create visual (small sphere)
        const geo = new THREE.SphereGeometry(0.08, 8, 8);
        const mat = new THREE.MeshStandardMaterial({ 
            color: this.config.color,
            emissive: this.config.color,
            emissiveIntensity: 0.5
        });
        this.mesh = new THREE.Mesh(geo, mat);
        engine.scene.add(this.mesh);
        
        // Create physics body
        if (physics.world && physics.RAPIER) {
            const bodyDesc = physics.RAPIER.RigidBodyDesc.dynamic()
                .setTranslation(origin.x, origin.y, origin.z)
                .setLinvel(
                    direction.x * throwForce,
                    direction.y * throwForce + 5, // arc upward
                    direction.z * throwForce
                );
            this.body = physics.world.createRigidBody(bodyDesc);
            
            const colDesc = physics.RAPIER.ColliderDesc.ball(0.08)
                .setRestitution(0.6) // Bouncy
                .setFriction(0.8)
                .setMass(0.3);
            this.collider = physics.world.createCollider(colDesc, this.body);
        }
        
        // Trail particles
        this.trail = [];
        
        engine.updatables.push(this);
    }
    
    update(dt) {
        if (!this.alive) return;
        
        // Sync visual to physics
        if (this.body) {
            const t = this.body.translation();
            this.mesh.position.set(t.x, t.y, t.z);
        }
        
        // Simple trail effect
        if (Math.random() < 0.3) {
            const trailDot = new THREE.Mesh(
                new THREE.SphereGeometry(0.02, 4, 4),
                new THREE.MeshBasicMaterial({ color: this.config.color, transparent: true, opacity: 0.6 })
            );
            trailDot.position.copy(this.mesh.position);
            engine.scene.add(trailDot);
            this.trail.push({ mesh: trailDot, life: 0.5 });
        }
        
        // Fade trail
        for (let i = this.trail.length - 1; i >= 0; i--) {
            this.trail[i].life -= dt;
            this.trail[i].mesh.material.opacity = Math.max(0, this.trail[i].life / 0.5);
            if (this.trail[i].life <= 0) {
                engine.scene.remove(this.trail[i].mesh);
                this.trail[i].mesh.geometry.dispose();
                this.trail[i].mesh.material.dispose();
                this.trail.splice(i, 1);
            }
        }
        
        // Fuse countdown
        this.fuseTimer -= dt;
        if (this.fuseTimer <= 0) {
            this.detonate();
        }
    }
    
    detonate() {
        this.alive = false;
        const pos = this.mesh.position.clone();
        
        switch (this.type) {
            case GRENADE_TYPES.FLASH:
                this.detonateFlash(pos);
                break;
            case GRENADE_TYPES.SMOKE:
                this.detonateSmoke(pos);
                break;
            case GRENADE_TYPES.KINETIC:
                this.detonateKinetic(pos);
                break;
        }
        
        // Cleanup
        this.destroy();
    }
    
    detonateFlash(pos) {
        // Check if player is looking at the grenade
        const cam = engine.camera;
        const camPos = new THREE.Vector3();
        cam.getWorldPosition(camPos);
        
        const dist = camPos.distanceTo(pos);
        if (dist < this.config.effectRadius) {
            const camDir = new THREE.Vector3();
            cam.getWorldDirection(camDir);
            
            const toGrenade = pos.clone().sub(camPos).normalize();
            const dot = camDir.dot(toGrenade);
            
            // If player is facing the grenade (dot > 0.3 means roughly within ~70° cone)
            if (dot > 0.3) {
                // Flash the screen white
                const flash = document.createElement('div');
                flash.style.position = 'fixed';
                flash.style.top = '0';
                flash.style.left = '0';
                flash.style.width = '100vw';
                flash.style.height = '100vh';
                flash.style.backgroundColor = 'white';
                flash.style.zIndex = '99999';
                flash.style.pointerEvents = 'none';
                flash.style.transition = 'opacity 2s ease-out';
                flash.style.opacity = '1';
                document.body.appendChild(flash);
                
                // Intensity based on distance and facing
                const intensity = dot * (1 - dist / this.config.effectRadius);
                const duration = Math.max(0.5, 2.0 * intensity);
                
                setTimeout(() => { flash.style.opacity = '0'; }, 100);
                setTimeout(() => flash.remove(), duration * 1000 + 200);
            }
        }
        
        // Flash visual burst
        this.burstEffect(pos, 0xffffff, 2.0);
        audioManager.playSyntheticSfx('headshot_snap');
    }
    
    detonateSmoke(pos) {
        // Create a bunch of smoke particles
        const smokeGroup = new THREE.Group();
        smokeGroup.position.copy(pos);
        engine.scene.add(smokeGroup);
        
        const smokeParticles = [];
        for (let i = 0; i < 40; i++) {
            const size = 0.8 + Math.random() * 1.2;
            const geo = new THREE.SphereGeometry(size, 6, 6);
            const mat = new THREE.MeshBasicMaterial({ 
                color: 0xcccccc, 
                transparent: true, 
                opacity: 0.5 + Math.random() * 0.3,
                depthWrite: false
            });
            const particle = new THREE.Mesh(geo, mat);
            
            // Random position within sphere
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const r = Math.random() * this.config.effectRadius * 0.8;
            particle.position.set(
                Math.sin(phi) * Math.cos(theta) * r,
                Math.sin(phi) * Math.sin(theta) * r * 0.5 + 1,
                Math.cos(phi) * r
            );
            
            smokeGroup.add(particle);
            smokeParticles.push(particle);
        }
        
        // Smoke lasts for duration then fades
        const duration = this.config.duration;
        const fadeStart = duration - 2.0;
        let elapsed = 0;
        
        const smokeUpdate = {
            update: (dt) => {
                elapsed += dt;
                
                // Slowly drift particles
                smokeParticles.forEach(p => {
                    p.position.y += dt * 0.2;
                    p.rotation.x += dt * 0.1;
                });
                
                // Fade out
                if (elapsed > fadeStart) {
                    const fadeProgress = (elapsed - fadeStart) / 2.0;
                    smokeParticles.forEach(p => {
                        p.material.opacity = Math.max(0, 0.6 * (1 - fadeProgress));
                    });
                }
                
                if (elapsed >= duration) {
                    smokeParticles.forEach(p => {
                        p.geometry.dispose();
                        p.material.dispose();
                    });
                    engine.scene.remove(smokeGroup);
                    const idx = engine.updatables.indexOf(smokeUpdate);
                    if (idx !== -1) engine.updatables.splice(idx, 1);
                }
            }
        };
        engine.updatables.push(smokeUpdate);
    }
    
    detonateKinetic(pos) {
        // Push all dynamic bodies within radius
        if (physics.world) {
            physics.world.bodies.forEach(body => {
                if (!body.isDynamic()) return;
                
                const bodyPos = body.translation();
                const dx = bodyPos.x - pos.x;
                const dy = bodyPos.y - pos.y;
                const dz = bodyPos.z - pos.z;
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                
                if (dist < this.config.effectRadius && dist > 0.1) {
                    const forceMag = this.config.force * (1 - dist / this.config.effectRadius);
                    const nx = dx / dist;
                    const ny = dy / dist;
                    const nz = dz / dist;
                    
                    body.applyImpulse({
                        x: nx * forceMag,
                        y: ny * forceMag + forceMag * 0.5, // Push up a bit
                        z: nz * forceMag
                    }, true);
                }
            });
        }
        
        // Visual burst
        this.burstEffect(pos, 0xff6600, 3.0);
        audioManager.playSyntheticSfx('shoot_shotgun');
    }
    
    burstEffect(pos, color, size) {
        // Quick expanding ring effect
        const geo = new THREE.RingGeometry(0.1, size, 16);
        const mat = new THREE.MeshBasicMaterial({ 
            color, 
            transparent: true, 
            opacity: 0.8,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        const ring = new THREE.Mesh(geo, mat);
        ring.position.copy(pos);
        ring.lookAt(engine.camera.position);
        engine.scene.add(ring);
        
        let life = 0.3;
        const burstUpdate = {
            update: (dt) => {
                life -= dt;
                ring.scale.multiplyScalar(1 + dt * 8);
                mat.opacity = Math.max(0, life / 0.3);
                
                if (life <= 0) {
                    engine.scene.remove(ring);
                    geo.dispose();
                    mat.dispose();
                    const idx = engine.updatables.indexOf(burstUpdate);
                    if (idx !== -1) engine.updatables.splice(idx, 1);
                }
            }
        };
        engine.updatables.push(burstUpdate);
    }
    
    destroy() {
        // Remove physics
        if (this.body && physics.world) {
            physics.world.removeRigidBody(this.body);
            this.body = null;
        }
        
        // Remove visual
        if (this.mesh) {
            engine.scene.remove(this.mesh);
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
        }
        
        // Remove trail
        this.trail.forEach(t => {
            engine.scene.remove(t.mesh);
            t.mesh.geometry.dispose();
            t.mesh.material.dispose();
        });
        this.trail = [];
        
        // Remove from updatables
        const idx = engine.updatables.indexOf(this);
        if (idx !== -1) engine.updatables.splice(idx, 1);
    }
}

// Grenade Manager — handles inventory and throwing
export class GrenadeManager {
    constructor(player) {
        this.player = player;
        this.selectedType = GRENADE_TYPES.FLASH;
        this.inventory = {
            [GRENADE_TYPES.FLASH]: 1,
            [GRENADE_TYPES.SMOKE]: 1,
            [GRENADE_TYPES.KINETIC]: 1
        };
        
        this.typeOrder = [GRENADE_TYPES.FLASH, GRENADE_TYPES.SMOKE, GRENADE_TYPES.KINETIC];
        this.holdingG = false;
        
        this.bindInput();
    }
    
    bindInput() {
        window.addEventListener('keydown', (e) => {
            if (gameState.currentState !== STATES.PLAYING) return;
            
            if (e.code === 'KeyG') {
                this.holdingG = true;
                // Show grenade type indicator
                window.dispatchEvent(new CustomEvent('grenadeReady', { 
                    detail: { type: this.selectedType, count: this.inventory[this.selectedType] }
                }));
            }
        });
        
        window.addEventListener('keyup', (e) => {
            if (e.code === 'KeyG' && this.holdingG) {
                this.holdingG = false;
                this.throwGrenade();
            }
        });
        
        // Scroll to cycle grenade types while holding G
        window.addEventListener('wheel', (e) => {
            if (!this.holdingG) return;
            
            const currentIdx = this.typeOrder.indexOf(this.selectedType);
            const dir = e.deltaY > 0 ? 1 : -1;
            const newIdx = (currentIdx + dir + this.typeOrder.length) % this.typeOrder.length;
            this.selectedType = this.typeOrder[newIdx];
            
            window.dispatchEvent(new CustomEvent('grenadeReady', { 
                detail: { type: this.selectedType, count: this.inventory[this.selectedType] }
            }));
        });
    }
    
    throwGrenade() {
        if (this.inventory[this.selectedType] <= 0) return;
        
        this.inventory[this.selectedType]--;
        
        const cam = engine.camera;
        const origin = new THREE.Vector3();
        cam.getWorldPosition(origin);
        
        const direction = new THREE.Vector3();
        cam.getWorldDirection(direction);
        
        new Grenade(this.selectedType, origin, direction);
        
        audioManager.playSyntheticSfx('jump'); // Throw sound
        
        window.dispatchEvent(new CustomEvent('grenadeThrown', { 
            detail: { type: this.selectedType, remaining: this.inventory[this.selectedType] }
        }));
    }
    
    refillAll() {
        this.inventory[GRENADE_TYPES.FLASH] = 1;
        this.inventory[GRENADE_TYPES.SMOKE] = 1;
        this.inventory[GRENADE_TYPES.KINETIC] = 1;
    }
}

export { GRENADE_TYPES };
