import gameState, { STATES } from '../core/GameState.js';
import radar from './Radar.js';
import statsManager from '../game/StatsManager.js';
import roundManager from '../game/RoundManager.js';

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
        this.roundInfo.innerHTML = `<span id="hud-score-atk" style="color:#ff4444;margin-right:10px">0</span><span id="hud-round-number">ROUND 1</span><span id="hud-score-def" style="color:#4488ff;margin-left:10px">0</span><div id="round-timer">1:45</div>`;
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

        // 8. Scope Overlay (hidden by default)
        this.scopeOverlay = this.createScopeOverlay();
        this.container.appendChild(this.scopeOverlay);

        // 9. In-game Scoreboard (Tab key toggle)
        this.scoreboardOverlay = this.createScoreboardOverlay();
        this.container.appendChild(this.scoreboardOverlay);

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
            padding: '12px 20px',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            borderLeft: `3px solid ${color}`,
            borderRadius: '8px',
            backdropFilter: 'blur(8px)',
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
            padding: '8px 30px',
            backgroundColor: 'rgba(0,0,0,0.5)',
            borderBottom: '2px solid rgba(255,255,255,0.1)',
            borderRadius: '0 0 12px 12px'
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
        entry.style.padding = '6px 15px';
        entry.style.fontSize = '12px';
        entry.style.borderRight = '3px solid #00f0ff';
        entry.style.borderRadius = '6px 0 0 6px';
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
            const roundEl = document.getElementById('hud-round-number');
            if (roundEl) roundEl.innerText = `ROUND ${e.detail.round}`;
        });

        window.addEventListener('scopeChanged', (e) => {
            this.setScopeVisible(e.detail.scoped);
        });

        // Tab key: show/hide in-game scoreboard
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Tab' && gameState.currentState === STATES.PLAYING) {
                e.preventDefault();
                this.showScoreboard();
            }
        });
        window.addEventListener('keyup', (e) => {
            if (e.code === 'Tab') {
                e.preventDefault();
                this.hideScoreboard();
            }
        });
    }

    show() { this.container.style.display = 'block'; }
    hide() {
        this.container.style.display = 'none';
        radar.hide();
    }

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

    createScoreboardOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'scoreboard-overlay';
        Object.assign(overlay.style, {
            position: 'absolute',
            top: '0', left: '0', width: '100%', height: '100%',
            display: 'none',
            justifyContent: 'center',
            alignItems: 'center',
            pointerEvents: 'none',
            zIndex: '2000'
        });

        const panel = document.createElement('div');
        panel.id = 'scoreboard-panel';
        Object.assign(panel.style, {
            width: '700px',
            maxHeight: '80vh',
            backgroundColor: 'rgba(10, 12, 18, 0.92)',
            borderRadius: '16px',
            border: '1px solid rgba(0, 240, 255, 0.2)',
            backdropFilter: 'blur(12px)',
            padding: '24px',
            fontFamily: '"Outfit", "Inter", sans-serif',
            color: '#fff',
            overflow: 'auto'
        });

        // Header with scores
        const header = document.createElement('div');
        header.id = 'scoreboard-header';
        Object.assign(header.style, {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '24px',
            marginBottom: '20px',
            fontSize: '14px',
            letterSpacing: '2px',
            textTransform: 'uppercase'
        });
        header.innerHTML = `
            <span style="color:#ff5555;font-size:28px;font-weight:900" id="sb-atk-score">0</span>
            <span style="opacity:0.5;font-size:12px">ATTACKERS</span>
            <span style="font-size:16px;opacity:0.3">|</span>
            <span style="opacity:0.5;font-size:12px">DEFENDERS</span>
            <span style="color:#5588ff;font-size:28px;font-weight:900" id="sb-def-score">0</span>
        `;
        panel.appendChild(header);

        // Table body
        const table = document.createElement('div');
        table.id = 'scoreboard-table';
        panel.appendChild(table);

        overlay.appendChild(panel);
        return overlay;
    }

    showScoreboard() {
        const overlay = document.getElementById('scoreboard-overlay');
        if (!overlay) return;
        overlay.style.display = 'flex';

        const scores = roundManager.scores || { ATTACKERS: 0, DEFENDERS: 0 };
        const atkEl = document.getElementById('sb-atk-score');
        const defEl = document.getElementById('sb-def-score');
        if (atkEl) atkEl.innerText = scores.ATTACKERS;
        if (defEl) defEl.innerText = scores.DEFENDERS;

        const table = document.getElementById('scoreboard-table');
        if (!table) return;
        table.innerHTML = '';

        const stats = statsManager.getScoreboard();
        const attackers = [];
        const defenders = [];

        for (const [id, data] of Object.entries(stats)) {
            if (data.team === 'ATTACKERS') attackers.push({ id, ...data });
            else defenders.push({ id, ...data });
        }

        // Sort by kills descending
        attackers.sort((a, b) => b.kills - a.kills);
        defenders.sort((a, b) => b.kills - a.kills);

        const renderTeam = (players, teamLabel, color) => {
            const section = document.createElement('div');
            section.style.marginBottom = '16px';

            const teamHeader = document.createElement('div');
            Object.assign(teamHeader.style, {
                display: 'grid',
                gridTemplateColumns: '1fr 60px 60px',
                padding: '6px 12px',
                fontSize: '11px',
                letterSpacing: '2px',
                opacity: '0.5',
                borderBottom: `1px solid ${color}33`
            });
            teamHeader.innerHTML = `<span>${teamLabel}</span><span style="text-align:center">K</span><span style="text-align:center">D</span>`;
            section.appendChild(teamHeader);

            players.forEach(p => {
                const row = document.createElement('div');
                const isLocal = p.id === ((window.localPlayer && window.localPlayer.id) || 'YOU');
                Object.assign(row.style, {
                    display: 'grid',
                    gridTemplateColumns: '1fr 60px 60px',
                    padding: '8px 12px',
                    fontSize: '14px',
                    borderRadius: '8px',
                    backgroundColor: isLocal ? 'rgba(0, 240, 255, 0.08)' : 'transparent',
                    borderLeft: isLocal ? '3px solid #00f0ff' : '3px solid transparent'
                });
                const nameColor = isLocal ? '#00f0ff' : '#ccc';
                row.innerHTML = `
                    <span style="color:${nameColor};font-weight:${isLocal ? '700' : '400'}">${p.id}${isLocal ? ' (YOU)' : ''}</span>
                    <span style="text-align:center;font-weight:700">${p.kills}</span>
                    <span style="text-align:center;opacity:0.6">${p.deaths}</span>
                `;
                section.appendChild(row);
            });
            table.appendChild(section);
        };

        renderTeam(attackers, 'ATTACKERS', '#ff5555');
        renderTeam(defenders, 'DEFENDERS', '#5588ff');
    }

    hideScoreboard() {
        const overlay = document.getElementById('scoreboard-overlay');
        if (overlay) overlay.style.display = 'none';
    }

    createScopeOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'scope-overlay';
        Object.assign(overlay.style, {
            position: 'absolute',
            top: '0', left: '0', width: '100%', height: '100%',
            display: 'none',
            pointerEvents: 'none'
        });

        // Dark vignette border
        const vignette = document.createElement('div');
        Object.assign(vignette.style, {
            position: 'absolute',
            top: '0', left: '0', width: '100%', height: '100%',
            background: 'radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.85) 70%)',
            borderRadius: '0'
        });
        overlay.appendChild(vignette);

        // Horizontal crosshair line
        const hLine = document.createElement('div');
        Object.assign(hLine.style, {
            position: 'absolute',
            top: '50%', left: '0',
            width: '100%', height: '1px',
            backgroundColor: 'rgba(0,240,255,0.6)',
            transform: 'translateY(-0.5px)'
        });
        overlay.appendChild(hLine);

        // Vertical crosshair line
        const vLine = document.createElement('div');
        Object.assign(vLine.style, {
            position: 'absolute',
            top: '0', left: '50%',
            width: '1px', height: '100%',
            backgroundColor: 'rgba(0,240,255,0.6)',
            transform: 'translateX(-0.5px)'
        });
        overlay.appendChild(vLine);

        // Center dot
        const dot = document.createElement('div');
        Object.assign(dot.style, {
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '6px', height: '6px',
            borderRadius: '50%',
            backgroundColor: '#ff0044',
            boxShadow: '0 0 6px #ff0044'
        });
        overlay.appendChild(dot);

        return overlay;
    }

    setScopeVisible(visible) {
        if (this.scopeOverlay) {
            this.scopeOverlay.style.display = visible ? 'block' : 'none';
        }
        // Hide default crosshair when scoped
        if (this.crosshair) {
            this.crosshair.style.display = visible ? 'none' : 'block';
        }
    }
}

export default new HUD();
