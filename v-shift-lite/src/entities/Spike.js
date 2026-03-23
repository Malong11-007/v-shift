import * as THREE from 'three';
import engine from '../core/Engine.js';
import audioManager from '../core/AudioManager.js';
import gameState, { STATES } from '../core/GameState.js';

const SPIKE_STATE = {
    IDLE: 'IDLE',           // Being carried
    PLANTING: 'PLANTING',   // Planting in progress
    PLANTED: 'PLANTED',     // Ticking down
    DEFUSING: 'DEFUSING',   // Being defused
    DETONATED: 'DETONATED', // Boom
    DEFUSED: 'DEFUSED'      // Crisis averted
};

// Spike sites in the arena
const SPIKE_SITES = [
    { name: 'A', position: new THREE.Vector3(-20, 0.05, -15), radius: 5 },
    { name: 'B', position: new THREE.Vector3(20, 0.05, 15), radius: 5 }
];

export default class Spike {
    constructor() {
        this.state = SPIKE_STATE.IDLE;
        this.carrier = null; // Player carrying the spike
        
        // Timers
        this.plantTime = 3.5;       // Seconds to plant
        this.defuseTime = 5.0;      // Seconds to defuse
        this.fuseTime = 40.0;       // Seconds until detonation
        this.plantProgress = 0;
        this.defuseProgress = 0;
        this.fuseTimer = 0;
        
        // Beep tracking
        this.lastBeepTime = 0;
        this.beepInterval = 1.0; // Start slow
        
        // Visuals
        this.createVisuals();
        this.createSiteMarkers();
        
        // HUD elements
        this.createHUD();
        
        // Input
        this.bindInput();
        
        engine.updatables.push(this);
    }
    
    createVisuals() {
        // Spike model — a glowing octahedron
        this.group = new THREE.Group();
        
        const geo = new THREE.OctahedronGeometry(0.25, 0);
        const mat = new THREE.MeshStandardMaterial({
            color: 0xff3333,
            emissive: 0xff0000,
            emissiveIntensity: 0.5,
            metalness: 0.8,
            roughness: 0.2
        });
        this.mesh = new THREE.Mesh(geo, mat);
        this.group.add(this.mesh);
        
        // Point light for glow
        this.light = new THREE.PointLight(0xff3333, 1, 5);
        this.light.position.y = 0.3;
        this.group.add(this.light);
        
        this.group.visible = false;
        engine.scene.add(this.group);
    }
    
    createSiteMarkers() {
        // Holographic site indicators
        this.siteMarkers = [];
        
        SPIKE_SITES.forEach(site => {
            const marker = new THREE.Group();
            marker.position.copy(site.position);
            
            // Ring on ground
            const ringGeo = new THREE.RingGeometry(site.radius - 0.3, site.radius, 32);
            const ringMat = new THREE.MeshBasicMaterial({
                color: 0xff3333,
                transparent: true,
                opacity: 0.3,
                side: THREE.DoubleSide,
                depthWrite: false
            });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = -Math.PI / 2;
            ring.position.y = 0.05;
            marker.add(ring);
            
            // Floating label
            const canvas = document.createElement('canvas');
            canvas.width = 128;
            canvas.height = 64;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ff3333';
            ctx.font = 'bold 48px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(site.name, 64, 48);
            
            const texture = new THREE.CanvasTexture(canvas);
            const labelMat = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.6, depthTest: false });
            const label = new THREE.Sprite(labelMat);
            label.scale.set(2, 1, 1);
            label.position.y = 3;
            marker.add(label);
            
            engine.scene.add(marker);
            this.siteMarkers.push(marker);
        });
    }
    
    createHUD() {
        // Progress bar for planting/defusing
        this.progressBar = document.createElement('div');
        this.progressBar.style.position = 'absolute';
        this.progressBar.style.bottom = '30%';
        this.progressBar.style.left = '50%';
        this.progressBar.style.transform = 'translateX(-50%)';
        this.progressBar.style.width = '200px';
        this.progressBar.style.height = '8px';
        this.progressBar.style.backgroundColor = 'rgba(0,0,0,0.6)';
        this.progressBar.style.border = '1px solid #ff3333';
        this.progressBar.style.borderRadius = '4px';
        this.progressBar.style.display = 'none';
        this.progressBar.style.zIndex = '100';
        this.progressBar.style.pointerEvents = 'none';
        
        this.progressFill = document.createElement('div');
        this.progressFill.style.height = '100%';
        this.progressFill.style.backgroundColor = '#ff3333';
        this.progressFill.style.borderRadius = '3px';
        this.progressFill.style.width = '0%';
        this.progressFill.style.transition = 'width 0.1s linear';
        this.progressBar.appendChild(this.progressFill);
        
        this.progressLabel = document.createElement('div');
        this.progressLabel.style.position = 'absolute';
        this.progressLabel.style.top = '-20px';
        this.progressLabel.style.width = '100%';
        this.progressLabel.style.textAlign = 'center';
        this.progressLabel.style.color = '#ff3333';
        this.progressLabel.style.fontSize = '14px';
        this.progressLabel.style.fontWeight = 'bold';
        this.progressLabel.style.fontFamily = 'monospace';
        this.progressBar.appendChild(this.progressLabel);
        
        document.getElementById('ui-root').appendChild(this.progressBar);
        
        // Fuse timer display
        this.fuseDisplay = document.createElement('div');
        this.fuseDisplay.style.position = 'absolute';
        this.fuseDisplay.style.top = '10%';
        this.fuseDisplay.style.left = '50%';
        this.fuseDisplay.style.transform = 'translateX(-50%)';
        this.fuseDisplay.style.fontSize = '32px';
        this.fuseDisplay.style.fontWeight = 'bold';
        this.fuseDisplay.style.fontFamily = 'monospace';
        this.fuseDisplay.style.color = '#ff3333';
        this.fuseDisplay.style.textShadow = '0 0 15px #ff0000';
        this.fuseDisplay.style.display = 'none';
        this.fuseDisplay.style.zIndex = '100';
        this.fuseDisplay.style.pointerEvents = 'none';
        document.getElementById('ui-root').appendChild(this.fuseDisplay);
    }
    
    bindInput() {
        this.planting = false;
        this.defusing = false;
        
        window.addEventListener('keydown', (e) => {
            if (gameState.currentState !== STATES.PLAYING) return;
            if (e.code !== 'KeyE') return;
            
            if (this.state === SPIKE_STATE.IDLE && this.carrier) {
                // Check if at a spike site
                const site = this.getNearestSite();
                if (site) {
                    this.startPlanting(site);
                }
            } else if (this.state === SPIKE_STATE.PLANTED) {
                // Check if close enough to defuse
                const pos = engine.camera.position;
                const dist = pos.distanceTo(this.group.position);
                if (dist < 3) {
                    this.startDefusing();
                }
            }
        });
        
        window.addEventListener('keyup', (e) => {
            if (e.code === 'KeyE') {
                this.cancelAction();
            }
        });
    }
    
    getNearestSite() {
        const camPos = engine.camera.position;
        for (const site of SPIKE_SITES) {
            const dx = camPos.x - site.position.x;
            const dz = camPos.z - site.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist < site.radius) return site;
        }
        return null;
    }
    
    assignCarrier(player) {
        this.carrier = player;
        this.state = SPIKE_STATE.IDLE;
    }
    
    startPlanting(site) {
        this.state = SPIKE_STATE.PLANTING;
        this.planting = true;
        this.plantProgress = 0;
        this.plantSite = site;
        
        this.progressBar.style.display = 'block';
        this.progressLabel.innerText = 'PLANTING SPIKE';
        this.progressFill.style.backgroundColor = '#ff3333';
    }
    
    startDefusing() {
        this.state = SPIKE_STATE.DEFUSING;
        this.defusing = true;
        this.defuseProgress = 0;
        
        this.progressBar.style.display = 'block';
        this.progressLabel.innerText = 'DEFUSING SPIKE';
        this.progressFill.style.backgroundColor = '#00f0ff';
    }
    
    cancelAction() {
        if (this.state === SPIKE_STATE.PLANTING) {
            this.state = SPIKE_STATE.IDLE;
            this.planting = false;
            this.plantProgress = 0;
        } else if (this.state === SPIKE_STATE.DEFUSING) {
            this.state = SPIKE_STATE.PLANTED;
            this.defusing = false;
            this.defuseProgress = 0;
        }
        this.progressBar.style.display = 'none';
    }
    
    update(dt) {
        if (gameState.currentState !== STATES.PLAYING) return;
        
        // Spinning animation for planted spike
        if (this.mesh && (this.state === SPIKE_STATE.PLANTED || this.state === SPIKE_STATE.DEFUSING)) {
            this.mesh.rotation.y += dt * 2;
            this.light.intensity = 0.5 + Math.sin(Date.now() * 0.005) * 0.5;
        }
        
        switch (this.state) {
            case SPIKE_STATE.PLANTING:
                this.plantProgress += dt;
                this.progressFill.style.width = `${(this.plantProgress / this.plantTime) * 100}%`;
                
                if (this.plantProgress >= this.plantTime) {
                    this.completePlant();
                }
                break;
                
            case SPIKE_STATE.PLANTED:
                this.fuseTimer -= dt;
                
                // Update HUD timer
                this.fuseDisplay.innerText = Math.ceil(this.fuseTimer) + 's';
                
                // Beeping SFX — accelerates as fuse runs out
                const fuseRatio = this.fuseTimer / this.fuseTime;
                this.beepInterval = 0.15 + fuseRatio * 0.85; // 1s → 0.15s
                
                const now = performance.now() / 1000;
                if (now - this.lastBeepTime > this.beepInterval) {
                    audioManager.playSyntheticSfx('heartbeat');
                    this.lastBeepTime = now;
                }
                
                // Flash more urgently
                if (this.fuseTimer < 10) {
                    this.fuseDisplay.style.animation = 'none';
                    this.fuseDisplay.style.opacity = Math.sin(Date.now() * 0.01) > 0 ? '1' : '0.3';
                }
                
                if (this.fuseTimer <= 0) {
                    this.detonate();
                }
                break;
                
            case SPIKE_STATE.DEFUSING:
                this.defuseProgress += dt;
                this.progressFill.style.width = `${(this.defuseProgress / this.defuseTime) * 100}%`;
                
                if (this.defuseProgress >= this.defuseTime) {
                    this.completeDefuse();
                }
                break;
        }
    }
    
    completePlant() {
        this.state = SPIKE_STATE.PLANTED;
        this.planting = false;
        this.fuseTimer = this.fuseTime;
        this.progressBar.style.display = 'none';
        
        // Place spike at site
        this.group.position.copy(this.plantSite.position);
        this.group.position.y = 0.3;
        this.group.visible = true;
        
        // Show timer
        this.fuseDisplay.style.display = 'block';
        
        window.dispatchEvent(new CustomEvent('spikePlanted', { detail: { site: this.plantSite.name } }));
        audioManager.playSyntheticSfx('kill_confirm');
    }
    
    completeDefuse() {
        this.state = SPIKE_STATE.DEFUSED;
        this.defusing = false;
        this.progressBar.style.display = 'none';
        this.fuseDisplay.style.display = 'none';
        
        this.group.visible = false;
        
        window.dispatchEvent(new CustomEvent('spikeDefused'));
        audioManager.playSyntheticSfx('kill_confirm');
    }
    
    detonate() {
        this.state = SPIKE_STATE.DETONATED;
        this.fuseDisplay.style.display = 'none';
        
        // Big screen flash + shake
        const flash = document.createElement('div');
        flash.style.position = 'fixed';
        flash.style.top = '0';
        flash.style.left = '0';
        flash.style.width = '100vw';
        flash.style.height = '100vh';
        flash.style.backgroundColor = '#ff3333';
        flash.style.zIndex = '99999';
        flash.style.pointerEvents = 'none';
        flash.style.transition = 'opacity 1.5s ease-out';
        document.body.appendChild(flash);
        setTimeout(() => { flash.style.opacity = '0'; }, 200);
        setTimeout(() => flash.remove(), 2000);
        
        this.group.visible = false;
        
        window.dispatchEvent(new CustomEvent('spikeDetonated'));
        audioManager.playSyntheticSfx('shoot_sniper');
    }
    
    reset() {
        this.state = SPIKE_STATE.IDLE;
        this.plantProgress = 0;
        this.defuseProgress = 0;
        this.fuseTimer = 0;
        this.group.visible = false;
        this.progressBar.style.display = 'none';
        this.fuseDisplay.style.display = 'none';
    }
}

export { SPIKE_STATE, SPIKE_SITES };
