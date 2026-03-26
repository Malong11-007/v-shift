import gameState, { STATES } from '../core/GameState.js';

class MainMenu {
    constructor() {
        this.container = document.createElement('div');
        this.container.style.position = 'absolute';
        this.container.style.top = '0';
        this.container.style.left = '0';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        // Transparent bg to show the 3D scene behind
        this.container.style.backgroundColor = 'transparent';
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';
        this.container.style.justifyContent = 'center';
        this.container.style.alignItems = 'flex-start'; // Align left
        this.container.style.paddingLeft = '10%';
        this.container.style.color = '#fff';
        this.container.style.fontFamily = 'Inter, sans-serif';
        this.container.style.zIndex = '1000';
        this.container.style.pointerEvents = 'auto';

        // Title
        this.title = document.createElement('h1');
        this.title.innerText = 'V-SHIFT';
        this.title.style.fontSize = '120px';
        this.title.style.margin = '0 0 20px 0';
        this.title.style.letterSpacing = '12px';
        this.title.style.textShadow = '0 0 30px #00f0ff';
        this.title.style.fontWeight = '800';
        this.title.style.fontStyle = 'italic';
        this.container.appendChild(this.title);

        this.buttonContainer = document.createElement('div');
        this.buttonContainer.style.display = 'flex';
        this.buttonContainer.style.flexDirection = 'column';
        this.buttonContainer.style.gap = '15px';
        this.container.appendChild(this.buttonContainer);

        this.createButton('PLAY', () => {
            gameState.transition(STATES.MODE_SELECT);
        });
        
        this.createButton('SETTINGS', () => {
            gameState.transition(STATES.SETTINGS);
        });
        
        this.createButton('LEADERBOARD', () => {
            gameState.transition(STATES.LEADERBOARD);
        });
    }

    createButton(text, onClick) {
        const btn = document.createElement('button');
        btn.innerText = text;
        btn.style.width = '300px';
        btn.style.padding = '15px 30px';
        btn.style.fontSize = '24px';
        btn.style.fontWeight = '800';
        btn.style.fontFamily = '"Outfit", "Inter", sans-serif';
        btn.style.letterSpacing = '4px';
        btn.style.textAlign = 'left';
        btn.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
        btn.style.color = '#fff';
        btn.style.border = '2px solid transparent';
        btn.style.borderLeft = '6px solid #00f0ff';
        btn.style.borderRadius = '8px';
        btn.style.cursor = 'pointer';
        btn.style.transition = 'all 0.2s';
        btn.style.backdropFilter = 'blur(6px)';
        
        btn.addEventListener('mouseenter', () => {
            btn.style.backgroundColor = 'rgba(0, 240, 255, 0.2)';
            btn.style.border = '2px solid #00f0ff';
            btn.style.borderLeft = '12px solid #00f0ff';
            btn.style.paddingLeft = '40px';
            btn.style.textShadow = '0 0 10px #00f0ff';
        });
        
        btn.addEventListener('mouseleave', () => {
            btn.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
            btn.style.border = '2px solid transparent';
            btn.style.borderLeft = '6px solid #00f0ff';
            btn.style.paddingLeft = '30px';
            btn.style.textShadow = 'none';
        });

        btn.addEventListener('click', () => {
            btn.style.transform = 'scale(0.95)';
            setTimeout(() => btn.style.transform = 'scale(1)', 100);
            onClick();
        });

        this.buttonContainer.appendChild(btn);
    }

    show(payload) {
        this.container.style.display = 'flex';
        // Unlock pointer on menu
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }
    }

    hide() {
        this.container.style.display = 'none';
    }
}

export default MainMenu;
