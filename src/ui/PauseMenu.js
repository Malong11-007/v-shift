import gameState, { STATES } from '../core/GameState.js';

class PauseMenu {
    constructor() {
        this.container = document.createElement('div');
        this.container.style.position = 'absolute';
        this.container.style.top = '0';
        this.container.style.left = '0';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.container.style.backdropFilter = 'blur(5px)';
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';
        this.container.style.justifyContent = 'center';
        this.container.style.alignItems = 'center';
        this.container.style.color = '#fff';
        this.container.style.fontFamily = 'Inter, sans-serif';
        this.container.style.zIndex = '4000';
        this.container.style.pointerEvents = 'auto';

        this.title = document.createElement('h2');
        this.title.innerText = 'SYSTEM PAUSED';
        this.title.style.fontSize = '50px';
        this.title.style.letterSpacing = '8px';
        this.title.style.marginBottom = '40px';
        this.title.style.textShadow = '0 0 20px #ff3333';
        this.container.appendChild(this.title);

        this.btnContainer = document.createElement('div');
        this.btnContainer.style.display = 'flex';
        this.btnContainer.style.flexDirection = 'column';
        this.btnContainer.style.gap = '20px';
        this.container.appendChild(this.btnContainer);

        this.createButton('RESUME', () => {
            gameState.transition(STATES.PLAYING);
        }, '#00f0ff');

        this.createButton('SETTINGS', () => {
            gameState.transition(STATES.SETTINGS);
        }, '#fff');

        this.createButton('ABORT MISSION (MAIN MENU)', () => {
            gameState.transition(STATES.MAIN_MENU);
        }, '#ff3333');
    }

    createButton(text, onClick, color) {
        const btn = document.createElement('button');
        btn.innerText = text;
        btn.style.width = '300px';
        btn.style.padding = '15px 0';
        btn.style.fontSize = '20px';
        btn.style.fontWeight = 'bold';
        btn.style.backgroundColor = 'transparent';
        btn.style.color = color;
        btn.style.border = `2px solid ${color}`;
        btn.style.borderRadius = '10px';
        btn.style.cursor = 'pointer';
        btn.style.letterSpacing = '2px';
        btn.style.transition = 'all 0.2s';
        
        btn.addEventListener('mouseenter', () => {
            btn.style.backgroundColor = color;
            btn.style.color = '#000';
            btn.style.boxShadow = `0 0 15px ${color}`;
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.backgroundColor = 'transparent';
            btn.style.color = color;
            btn.style.boxShadow = 'none';
        });

        btn.addEventListener('click', onClick);
        this.btnContainer.appendChild(btn);
    }

    show(payload) {
        this.container.style.display = 'flex';
    }

    hide() {
        this.container.style.display = 'none';
    }
}

export default PauseMenu;
