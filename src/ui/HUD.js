import gameState, { STATES } from '../core/GameState.js';
import radar from './Radar.js';

class HUD {
    constructor() {
        this.container = document.createElement('div');
        this.container.id = 'hud-container';
        this.applyStyles();
        
        // 1. Health Display (Bottom Left)
        this.healthContainer = this.createStatBox('HEALTH', '100', '#00f0ff');
        this.healthContainer.style.bottom = '40px';
        this.healthContainer.style.left = '40px';
        this.container.appendChild(this.healthContainer);
        
        // 2. Ammo Display (Bottom Right)
        this.ammoContainer = this.createStatBox('AMMO', '30 / 90', '#ffffff');
        this.ammoContainer.style.bottom = '40px';
        this.ammoContainer.style.right = '40px';
        this.container.appendChild(this.ammoContainer);
        
        // 3. Round Info (Top Center)
        this.roundInfo = document.createElement('div');
        this.applyRoundStyles(this.roundInfo);
        this.roundInfo.innerHTML = `<span>ROUND 1</span><div id="round-timer">1:45</div>`;
        this.container.appendChild(this.roundInfo);

        // 4. Hit Marker
        this.hitMarker = document.createElement('div');
        this.applyHitMarkerStyles(this.hitMarker);
        this.container.appendChild(this.hitMarker);
        
        // 5. Crosshair
        this.crosshair = document.createElement('div');
        this.applyCrosshairStyles(this.crosshair);
        this.container.appendChild(this.crosshair);

        // 6. Kill Feed (Top Right)
        this.killFeed = document.createElement('div');
        this.killFeed.id = 'kill-feed';
        this.applyKillFeedStyles(this.killFeed);
        this.container.appendChild(this.killFeed);

        document.body.appendChild(this.container);
        
        this.initEventListeners();
    }

    applyStyles() {
        Object.assign(this.container.style, {
            position: 'absolute',
            top: '0', left: '0', width: '100%', height: '100%',
            pointerEvents: 'none',
            fontFamily: '"Outfit", "Inter", sans-serif',
            color: '#fff',
            display: 'none',
            zIndex: '1000'
        });
    }

    createStatBox(label, value, color) {
        const box = document.createElement('div');
        Object.assign(box.style, {
            position: 'absolute',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            padding: '10px 20px',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            borderLeft: `4px solid ${color}`,
            backdropFilter: 'blur(5px)',
            minWidth: '120px'
        });
        
        const labelEl = document.createElement('span');
        labelEl.innerText = label;
        labelEl.style.fontSize = '12px';
        labelEl.style.letterSpacing = '2px';
        labelEl.style.opacity = '0.6';
        
        const valueEl = document.createElement('span');
        valueEl.id = `hud-${label.toLowerCase()}-value`;
        valueEl.innerText = value;
        valueEl.style.fontSize = '32px';
        valueEl.style.fontWeight = '900';
        valueEl.style.fontStyle = 'italic';
        
        box.appendChild(labelEl);
        box.appendChild(valueEl);
        return box;
    }

    applyRoundStyles(el) {
        Object.assign(el.style, {
            position: 'absolute',
            top: '20px', left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
            fontSize: '14px',
            letterSpacing: '3px',
            padding: '5px 30px',
            backgroundColor: 'rgba(0,0,0,0.5)',
            borderBottom: '2px solid rgba(255,255,255,0.1)'
        });
    }

    applyHitMarkerStyles(el) {
        Object.assign(el.style, {
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '20px', height: '20px',
            border: '2px solid #fff',
            borderRadius: '50%',
            opacity: '0',
            transition: 'opacity 0.1s, width 0.1s, height 0.1s'
        });
    }

    applyCrosshairStyles(el) {
        Object.assign(el.style, {
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '4px', height: '4px',
            backgroundColor: '#00f0ff',
            borderRadius: '50%',
            boxShadow: '0 0 5px #00f0ff'
        });
    }

    applyKillFeedStyles(el) {
        Object.assign(el.style, {
            position: 'absolute',
            top: '20px', right: '20px',
            width: '250px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '5px'
        });
    }

    update(player, dt) {
        if (gameState.currentState !== STATES.PLAYING) {
            this.hide();
            return;
        }
        this.show();
        
        // Update Stats
        const hpVal = document.getElementById('hud-health-value');
        if (hpVal) hpVal.innerText = Math.ceil(player.health || 0);
        
        // Update Radar
        radar.update(player);
    }

    showHitMarker(type = 'body') {
        this.hitMarker.style.borderColor = type === 'head' ? '#ff3333' : '#fff';
        this.hitMarker.style.width = '30px';
        this.hitMarker.style.height = '30px';
        this.hitMarker.style.opacity = '1';
        
        setTimeout(() => {
            this.hitMarker.style.opacity = '0';
            this.hitMarker.style.width = '20px';
            this.hitMarker.style.height = '20px';
        }, 100);
    }

    addKillEntry(killer, victim, weapon) {
        const entry = document.createElement('div');
        entry.style.backgroundColor = 'rgba(0,0,0,0.6)';
        entry.style.padding = '5px 15px';
        entry.style.fontSize = '12px';
        entry.style.borderRight = '3px solid #00f0ff';
        entry.innerHTML = `<span style="color:#00f0ff">${killer}</span> [${weapon}] <span style="color:#ff3333">${victim}</span>`;
        
        this.killFeed.prepend(entry);
        setTimeout(() => entry.remove(), 5000);
    }

    initEventListeners() {
        window.addEventListener('playerHealthChanged', (e) => {
            const el = document.getElementById('hud-health-value');
            if (el) el.innerText = Math.ceil(e.detail);
        });
        
        window.addEventListener('weaponAmmoSync', (e) => {
            const el = document.getElementById('hud-ammo-value');
            if (el) el.innerText = `${e.detail.current} / ${e.detail.max}`;
        });
        
        window.addEventListener('hitMarker', (e) => {
            this.showHitMarker(e.detail.type);
        });

        window.addEventListener('playerKilled', (e) => {
            const d = e.detail;
            const killerName = d.killerIsLocal ? 'YOU' : 'OPERATOR';
            this.addKillEntry(killerName, d.victimId, d.weaponId);
        });
    }

    show() { this.container.style.display = 'block'; }
    hide() { this.container.style.display = 'none'; }
}

export default new HUD();
