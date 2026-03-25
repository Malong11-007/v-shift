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
        this.roundInfo.innerHTML = `<span id="hud-score-atk" style="color:#ff4444;margin-right:10px">0</span><span>ROUND 1</span><span id="hud-score-def" style="color:#4488ff;margin-left:10px">0</span><div id="round-timer">1:45</div>`;
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

        // 7. Momentum Surge Meter (Bottom Center)
        this.surgeMeter = this.createSurgeMeter();
        this.container.appendChild(this.surgeMeter);

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

    createSurgeMeter() {
        const wrapper = document.createElement('div');
        wrapper.id = 'hud-surge';
        Object.assign(wrapper.style, {
            position: 'absolute',
            bottom: '32px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '280px',
            display: 'none',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
            pointerEvents: 'none'
        });

        const label = document.createElement('div');
        label.id = 'hud-surge-label';
        Object.assign(label.style, {
            fontSize: '14px',
            letterSpacing: '3px',
            fontWeight: '800',
            color: '#00ffaa',
            textShadow: '0 0 12px rgba(0, 255, 170, 0.7)'
        });
        label.innerText = 'SURGE READY';

        const bar = document.createElement('div');
        bar.id = 'hud-surge-bar';
        Object.assign(bar.style, {
            width: '100%',
            height: '10px',
            background: 'rgba(0,0,0,0.45)',
            borderRadius: '999px',
            overflow: 'hidden',
            border: '1px solid rgba(0,255,170,0.4)',
            boxShadow: '0 0 18px rgba(0,255,170,0.3)'
        });

        const fill = document.createElement('div');
        fill.id = 'hud-surge-fill';
        Object.assign(fill.style, {
            width: '0%',
            height: '100%',
            background: 'linear-gradient(90deg, #00ffaa, #57fff3)',
            boxShadow: '0 0 20px rgba(0,255,170,0.7)',
            transition: 'width 0.15s ease-out'
        });

        bar.appendChild(fill);
        wrapper.appendChild(label);
        wrapper.appendChild(bar);
        return wrapper;
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

        window.addEventListener('momentumSurgeUpdate', (e) => this.renderSurgeMeter(e.detail));
        window.addEventListener('momentumSurgeExpired', () => this.hideSurgeMeter());

        window.addEventListener('scoresUpdated', (e) => {
            const scores = e.detail.scores;
            const atkEl = document.getElementById('hud-score-atk');
            const defEl = document.getElementById('hud-score-def');
            if (atkEl) atkEl.innerText = scores.ATTACKERS;
            if (defEl) defEl.innerText = scores.DEFENDERS;
        });

        window.addEventListener('roundStarted', (e) => {
            const roundSpan = this.roundInfo.querySelector('span:nth-child(2)');
            if (roundSpan) roundSpan.innerText = `ROUND ${e.detail.round}`;
        });
    }

    show() { this.container.style.display = 'block'; }
    hide() { this.container.style.display = 'none'; }

    renderSurgeMeter(detail) {
        const wrapper = document.getElementById('hud-surge');
        const label = document.getElementById('hud-surge-label');
        const fill = document.getElementById('hud-surge-fill');
        if (!wrapper || !label || !fill) return;

        const pct = Math.max(0, Math.min(1, (detail.remaining || 0) / (detail.duration || 1)));
        fill.style.width = `${(pct * 100).toFixed(1)}%`;

        if (detail.active) {
            wrapper.style.display = 'flex';
            label.innerText = `SURGE x${detail.multiplier.toFixed(2)}`;
            fill.style.opacity = '1';
        } else if (detail.remaining === 0) {
            this.hideSurgeMeter();
        }
    }

    hideSurgeMeter() {
        const wrapper = document.getElementById('hud-surge');
        const fill = document.getElementById('hud-surge-fill');
        const label = document.getElementById('hud-surge-label');
        if (!wrapper || !fill || !label) return;
        wrapper.style.display = 'none';
        fill.style.width = '0%';
        label.innerText = 'SURGE READY';
    }
}

export default new HUD();
