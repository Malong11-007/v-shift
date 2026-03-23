import * as THREE from 'three';
import engine from '../core/Engine.js';
import physics from '../physics/PhysicsWorld.js';
import collision from '../physics/Collision.js';
import CharacterModel from '../models/CharacterModel.js';
import ProceduralAnimator from '../models/ProceduralAnimator.js';
import WeaponFactory from '../models/WeaponFactory.js';

/**
 * Represents a remote player in multiplayer — renders their third-person model
 * and interpolates position/rotation from network snapshots.
 */
export default class RemotePlayer {
    constructor(id, name, archetype) {
        this.id = id;
        this.name = name;
        this.archetype = archetype;
        this.health = 100;
        this.isAlive = true;
        
        // Visual
        this.group = new THREE.Group();
        engine.scene.add(this.group);
        
        this.initVisuals();
        
        // Interpolation state
        this.snapshots = [];     // Last N snapshots: { pos, rot, ts }
        this.maxSnapshots = 10;
        this.interpDelay = 100;  // ms behind latest snapshot
        
        // Nameplate
        this.createNameplate();
        
        // Physics Collider
        this.initPhysics();
        
        engine.updatables.push(this);
    }
    
    initPhysics() {
        // Create a capsule collider (0.6 halfHeight, 0.3 radius)
        this.collider = physics.createCapsule(0, 0, 0, 0.6, 0.3);
        collision.colliderMap.set(this.collider.handle, this);
    }
    
    initVisuals() {
        try {
            this.character = new CharacterModel(0xcc4444); // Red team
            this.mesh = this.character.root;
            this.mesh.scale.set(1.3, 1.3, 1.3);
            this.group.add(this.mesh);
            
            this.animator = new ProceduralAnimator(this.character);
            
            this.weapon = WeaponFactory.createWeapon('V44SABRE');
            this.character.weaponMount.add(this.weapon);
            this.animator.setWeaponPose('RIFLE');
        } catch (e) {
            console.error(`[RemotePlayer ${this.id}] Visual init error:`, e);
            const geo = new THREE.CapsuleGeometry(0.5, 1, 4, 8);
            const mat = new THREE.MeshStandardMaterial({ color: 0xcc4444 });
            this.mesh = new THREE.Mesh(geo, mat);
            this.mesh.position.y = 1.0;
            this.group.add(this.mesh);
        }
    }
    
    createNameplate() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(this.name, 128, 40);
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
        this.nameSprite = new THREE.Sprite(spriteMat);
        this.nameSprite.scale.set(2, 0.5, 1);
        this.nameSprite.position.y = 2.5;
        this.group.add(this.nameSprite);
    }
    
    /**
     * Push a new state snapshot from the network.
     */
    pushSnapshot(snapshot) {
        this.snapshots.push({
            pos: new THREE.Vector3(snapshot.x, snapshot.y, snapshot.z),
            rot: snapshot.yaw || 0,
            ts: snapshot.ts || Date.now(),
            weaponId: snapshot.weaponId
        });
        
        // Keep buffer bounded
        if (this.snapshots.length > this.maxSnapshots) {
            this.snapshots.shift();
        }
    }
    
    update(dt) {
        if (!this.isAlive) return;
        
        // Interpolate between snapshots
        if (this.snapshots.length < 2) return;
        
        const renderTime = Date.now() - this.interpDelay;
        
        // Find the two snapshots to interpolate between
        let s0 = this.snapshots[0];
        let s1 = this.snapshots[1];
        
        for (let i = 0; i < this.snapshots.length - 1; i++) {
            if (this.snapshots[i].ts <= renderTime && this.snapshots[i + 1].ts >= renderTime) {
                s0 = this.snapshots[i];
                s1 = this.snapshots[i + 1];
                break;
            }
        }
        
        // If renderTime is past all snapshots, extrapolate from the last
        if (renderTime > this.snapshots[this.snapshots.length - 1].ts) {
            const last = this.snapshots[this.snapshots.length - 1];
            const prev = this.snapshots[this.snapshots.length - 2];
            
            // Only extrapolate if gap is < 200ms
            if (renderTime - last.ts < 200) {
                const timeDelta = (last.ts - prev.ts) || 16;
                const extrapFactor = (renderTime - last.ts) / timeDelta;
                
                const velocity = last.pos.clone().sub(prev.pos);
                this.group.position.copy(last.pos.clone().add(velocity.multiplyScalar(extrapFactor)));
                this.group.rotation.y = last.rot;
            }
            return;
        }
        
        // Linear interpolation
        const totalTime = s1.ts - s0.ts;
        const t = totalTime > 0 ? (renderTime - s0.ts) / totalTime : 0;
        const clampedT = Math.max(0, Math.min(1, t));
        
        this.group.position.lerpVectors(s0.pos, s1.pos, clampedT);
        this.group.rotation.y = s0.rot + (s1.rot - s0.rot) * clampedT;
        
        // Sync collider position
        if (this.collider) {
            this.collider.setTranslation({ x: this.group.position.x, y: this.group.position.y + 1.0, z: this.group.position.z });
        }
    }
    
    takeDamage(damage, isHeadshot, context = {}) {
        // In multiplayer, the victim's client usually authoritatively handles their own death
        // but we can update local health state for HUD/Feedback
        this.health -= damage;
        console.log(`[RemotePlayer ${this.id}] took ${damage} damage. Health: ${this.health}`);
    }
    
    die() {
        this.isAlive = false;
        if (this.mesh) this.mesh.visible = false;
        if (this.nameSprite) this.nameSprite.visible = false;
    }
    
    respawn(pos) {
        this.isAlive = true;
        this.health = 100;
        if (this.mesh) this.mesh.visible = true;
        if (this.nameSprite) this.nameSprite.visible = true;
        this.group.position.copy(pos);
        this.snapshots = [];
    }
    
    destroy() {
        if (this.collider) {
            collision.colliderMap.delete(this.collider.handle);
            physics.world.removeCollider(this.collider, true);
        }
        engine.scene.remove(this.group);
        const idx = engine.updatables.indexOf(this);
        if (idx !== -1) engine.updatables.splice(idx, 1);
    }
}
