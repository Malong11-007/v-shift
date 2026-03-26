import gameState, { STATES } from '../core/GameState.js';
import statsManager from '../game/StatsManager.js';

class Scoreboard {
    constructor() {
        this.container = document.createElement('div');
        this.container.style.position = 'absolute';
        this.container.style.top = '0';
        this.container.style.left = '0';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.backgroundColor = 'rgba(10, 10, 10, 0.95)';
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';
        this.container.style.justifyContent = 'center';
        this.container.style.alignItems = 'center';
        this.container.style.color = '#fff';
        this.container.style.fontFamily = '"Outfit", "Inter", sans-serif';
        this.container.style.zIndex = '3000';
        this.container.style.pointerEvents = 'auto';

        this.title = document.createElement('h2');
        this.title.innerText = 'MATCH COMPLETE';
        this.title.style.fontSize = '50px';
        this.title.style.letterSpacing = '5px';
        this.title.style.marginBottom = '40px';
        this.title.style.textShadow = '0 0 15px #00f0ff';
        this.container.appendChild(this.title);

        this.awardsContainer = document.createElement('div');
        this.awardsContainer.style.display = 'flex';
        this.awardsContainer.style.gap = '20px';
        this.awardsContainer.style.marginBottom = '40px';
        this.awardsContainer.style.justifyContent = 'center';
        this.awardsContainer.style.flexWrap = 'wrap';
        this.container.appendChild(this.awardsContainer);

        this.button = document.createElement('button');
        this.button.innerText = 'RETURN TO BASE';
        this.button.style.padding = '15px 50px';
        this.button.style.fontSize = '20px';
        this.button.style.fontWeight = 'bold';
        this.button.style.backgroundColor = '#00f0ff';
        this.button.style.color = '#000';
        this.button.style.border = 'none';
        this.button.style.borderRadius = '12px';
        this.button.style.cursor = 'pointer';
        this.button.style.transition = 'transform 0.15s, box-shadow 0.15s';
        this.button.addEventListener('mouseenter', () => {
            this.button.style.transform = 'scale(1.05)';
            this.button.style.boxShadow = '0 0 20px rgba(0,240,255,0.5)';
        });
        this.button.addEventListener('mouseleave', () => {
            this.button.style.transform = 'scale(1)';
            this.button.style.boxShadow = 'none';
        });
        this.button.addEventListener('click', () => {
            gameState.transition(STATES.MAIN_MENU);
        });
        this.container.appendChild(this.button);
    }

    show(payload) {
        this.container.style.display = 'flex';
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }
        
        // Render Awards
        this.awardsContainer.innerHTML = '';
        const awards = statsManager.calculateAwards();
        
        if (awards.length === 0) {
             const empty = document.createElement('div');
             empty.innerText = "NO AWARDS EARNED";
             empty.style.color = '#888';
             this.awardsContainer.appendChild(empty);
        } else {
             awards.forEach(award => {
                 const card = document.createElement('div');
                 card.style.backgroundColor = 'rgba(0, 240, 255, 0.1)';
                 card.style.border = '2px solid #00f0ff';
                 card.style.padding = '20px';
                 card.style.borderRadius = '12px';
                 card.style.textAlign = 'center';
                 card.style.minWidth = '180px';
                 card.style.transition = 'transform 0.2s';
                 card.addEventListener('mouseenter', () => { card.style.transform = 'translateY(-4px)'; });
                 card.addEventListener('mouseleave', () => { card.style.transform = 'translateY(0)'; });
                 
                 card.innerHTML = `
                    <div style="font-size: 40px; margin-bottom: 10px;">${award.icon}</div>
                    <div style="font-weight: bold; font-size: 20px; margin-bottom: 5px; color: #00f0ff;">${award.title}</div>
                    <div style="font-size: 14px; color: #ccc;">${award.desc}</div>
                 `;
                 this.awardsContainer.appendChild(card);
             });
        }
    }

    hide() {
        this.container.style.display = 'none';
    }
}

export default Scoreboard;
