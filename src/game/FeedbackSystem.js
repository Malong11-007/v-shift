import audioManager from '../core/AudioManager.js';

class FeedbackSystem {
    constructor() {
        this.recentKills = []; // Stores timestamps of recent kills
        this.bindEvents();
    }

    bindEvents() {
        window.addEventListener('hitMarker', (e) => {
            const { type, damage } = e.detail;
            
            if (type === 'head') {
                audioManager.playSyntheticSfx('headshot_snap');
                this.screenFlash('white');
            } else if (type !== 'wall') {
                audioManager.playSyntheticSfx('hit');
            }
        });

        window.addEventListener('playerKilled', (e) => {
            const data = e.detail;
            const now = performance.now();
            
            // Multi-kill logic
            this.recentKills.push(now);
            // Prune kills older than 3 seconds
            this.recentKills = this.recentKills.filter(t => now - t <= 3000);
            
            const killCount = this.recentKills.length;
            this.announceMultiKill(killCount);
            this.triggerMomentumSurge(killCount, data);

            if (data.isFirstBlood) {
                this.showLabel('FIRST BLOOD', '#ff3333', 50);
            }
            if (data.isHeadshot) {
                this.screenShake(5);
            }
            
            // Play kill confirm sound
            audioManager.playSyntheticSfx('kill_confirm');
            
            // Movement Rewards (7b.3)
            if (data.killerIsLocal) {
                if (data.killerSliding) {
                    this.showLabel('SLIDE KILL', '#00f0ff', 40, 200);
                } else if (data.killerAirborne) {
                    this.showLabel('AIRSHOT', '#ff00ff', 40, -200);
                }
                
                if (data.bhopChain >= 3) {
                    const extra = data.bhopChain >= 5 ? ' SPEED DEMON!' : '';
                    this.showLabel(`x${data.bhopChain} PERFECT CHAIN${extra}`, '#00ffaa', 30, 0, 150);
                }
            }
        });
    }

    triggerMomentumSurge(killCount, data) {
        if (!data.killerIsLocal) return;
        const styleKill = data.killerSliding || data.killerAirborne || (data.bhopChain || 0) >= 4;
        const streakKill = killCount >= 2;
        if (!styleKill && !streakKill) return;

        const baseBoost = 1.2;
        const streakBonus = Math.min(Math.max(killCount - 1, 0) * 0.1, 0.3);
        const styleBonus = (data.killerSliding ? 0.05 : 0) + (data.killerAirborne ? 0.05 : 0);
        const multiplier = Number((baseBoost + streakBonus + styleBonus).toFixed(2));

        window.dispatchEvent(new CustomEvent('momentumSurge', {
            detail: {
                multiplier,
                duration: 4,
                source: styleKill ? 'STYLE' : 'CHAIN'
            }
        }));

        this.showLabel('MOMENTUM SURGE', '#00ffaa', 42, 0, -160);
        this.screenFlash('rgba(0, 255, 170, 0.2)', 250);
        audioManager.playSyntheticSfx('bhop_success');
    }

    announceMultiKill(count) {
        let text = "";
        let color = "#ffaa00";
        if (count === 2) text = "DOUBLE KILL";
        else if (count === 3) text = "TRIPLE KILL";
        else if (count === 4) { text = "QUAD KILL"; color = "#ff5500" }
        else if (count >= 5) { text = "ACE"; color = "#ff0000" }
        
        if (text) {
            console.log(`[Announcer] ${text}!`);
            this.showLabel(text, color, 40 + count*10, 0, -100);
        }
    }

    showLabel(text, color, size, offsetX = 0, offsetY = 0) {
        const label = document.createElement('div');
        label.innerText = text;
        label.style.position = 'absolute';
        label.style.top = `calc(25% + ${offsetY}px)`;
        label.style.left = `calc(50% + ${offsetX}px)`;
        label.style.transform = 'translate(-50%, -50%) scale(0.5)';
        label.style.fontSize = `${size}px`;
        label.style.fontWeight = '800';
        label.style.fontStyle = 'italic';
        label.style.color = color;
        label.style.textShadow = `0 0 15px ${color}`;
        label.style.pointerEvents = 'none';
        label.style.zIndex = '1001';
        label.style.fontFamily = 'Inter, sans-serif';
        label.style.transition = 'opacity 1s ease-in, transform 0.2s cubic-bezier(0.2, 1.5, 0.5, 1)';
        
        const uiRoot = document.getElementById('ui-root');
        if (uiRoot) uiRoot.appendChild(label);
        
        // Pop in
        requestAnimationFrame(() => {
            label.style.transform = 'translate(-50%, -50%) scale(1)';
            setTimeout(() => {
                label.style.opacity = '0';
                setTimeout(() => label.remove(), 1000);
            }, 1000);
        });
    }

    screenFlash(color = 'white', durationMs = 100) {
        // Create an overlay div
        const flash = document.createElement('div');
        flash.style.position = 'absolute';
        flash.style.top = '0';
        flash.style.left = '0';
        flash.style.width = '100%';
        flash.style.height = '100%';
        flash.style.backgroundColor = color;
        flash.style.pointerEvents = 'none';
        flash.style.zIndex = '9999';
        flash.style.opacity = '1';
        flash.style.transition = `opacity ${durationMs}ms ease-out`;
        
        const uiRoot = document.getElementById('ui-root');
        if (!uiRoot) return;
        uiRoot.appendChild(flash);
        
        // Next frame, fade out
        requestAnimationFrame(() => {
            flash.style.opacity = '0';
            setTimeout(() => flash.remove(), durationMs + 50);
        });
    }

    screenShake(intensity) {
        // A simple CSS shake applied to the canvas/body
        const app = document.getElementById('app');
        if (!app) return;
        
        let frames = 0;
        const maxFrames = 10;
        
        const shakeInterval = setInterval(() => {
            if (frames > maxFrames) {
                clearInterval(shakeInterval);
                app.style.transform = `translate(0px, 0px)`;
                return;
            }
            
            const dx = (Math.random() - 0.5) * intensity;
            const dy = (Math.random() - 0.5) * intensity;
            
            app.style.transform = `translate(${dx}px, ${dy}px)`;
            frames++;
        }, 16);
    }
}

const feedbackSystem = new FeedbackSystem();
export default feedbackSystem;
