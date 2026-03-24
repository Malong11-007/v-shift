import gameState, { STATES } from '../core/GameState.js';
import api from '../utils/API.js';

class NameSelect {
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
        this.container.style.fontFamily = 'Inter, sans-serif';
        this.container.style.zIndex = '2000';
        this.container.style.pointerEvents = 'auto';

        this.title = document.createElement('h2');
        this.title.innerText = 'INITIALIZE OPERATOR';
        this.title.style.fontSize = '40px';
        this.title.style.letterSpacing = '5px';
        this.title.style.marginBottom = '10px';
        this.title.style.textShadow = '0 0 15px #00f0ff';
        this.container.appendChild(this.title);

        this.subtitle = document.createElement('p');
        this.subtitle.innerText = 'Enter your tactical callsign.';
        this.subtitle.style.fontSize = '18px';
        this.subtitle.style.color = '#888';
        this.subtitle.style.marginBottom = '40px';
        this.container.appendChild(this.subtitle);

        this.input = document.createElement('input');
        this.input.type = 'text';
        this.input.maxLength = 16;
        this.input.placeholder = 'e.g. GHOST_99';
        this.input.style.width = '400px';
        this.input.style.padding = '15px 20px';
        this.input.style.fontSize = '24px';
        this.input.style.fontFamily = 'monospace';
        this.input.style.backgroundColor = '#111';
        this.input.style.color = '#fff';
        this.input.style.border = '2px solid #333';
        this.input.style.borderRadius = '4px';
        this.input.style.outline = 'none';
        this.input.style.textAlign = 'center';
        this.input.style.textTransform = 'uppercase';
        this.input.style.marginBottom = '20px';
        this.input.style.transition = 'border-color 0.2s';
        
        this.input.addEventListener('focus', () => {
            this.input.style.borderColor = '#00f0ff';
            this.input.style.boxShadow = '0 0 10px rgba(0, 240, 255, 0.3)';
        });
        this.input.addEventListener('blur', () => {
            this.input.style.borderColor = '#333';
            this.input.style.boxShadow = 'none';
        });
        
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.submitName();
        });
        
        this.container.appendChild(this.input);

        this.errorText = document.createElement('p');
        this.errorText.style.color = '#ff3333';
        this.errorText.style.height = '20px';
        this.errorText.style.marginBottom = '20px';
        this.container.appendChild(this.errorText);

        this.offlineNotice = document.createElement('p');
        this.offlineNotice.style.color = '#00f0ff';
        this.offlineNotice.style.marginBottom = '20px';
        this.offlineNotice.style.display = 'none';
        this.offlineNotice.innerText = 'Offline mode: backend disabled, callsign will stay on this device.';
        this.container.appendChild(this.offlineNotice);

        this.button = document.createElement('button');
        this.button.innerText = 'CONFIRM';
        this.button.style.padding = '15px 50px';
        this.button.style.fontSize = '20px';
        this.button.style.fontWeight = 'bold';
        this.button.style.backgroundColor = '#00f0ff';
        this.button.style.color = '#000';
        this.button.style.border = 'none';
        this.button.style.borderRadius = '4px';
        this.button.style.cursor = 'pointer';
        this.button.style.letterSpacing = '2px';
        this.button.addEventListener('click', () => this.submitName());
        this.container.appendChild(this.button);
    }

    async submitName() {
        const name = this.input.value.trim().toUpperCase();
        if (name.length < 3) {
            this.errorText.innerText = 'Callsign must be at least 3 characters.';
            return;
        }
        if (!/^[A-Z0-9_]+$/.test(name)) {
            this.errorText.innerText = 'Alphanumeric and underscores only.';
            return;
        }
        
        this.button.disabled = true;
        this.button.innerText = 'CHECKING...';
        this.errorText.innerText = '';
        
        try {
            const check = await api.checkName(name);
            if (!check.available) {
                this.errorText.innerText = 'Callsign already taken.';
                this.button.disabled = false;
                this.button.innerText = 'CONFIRM';
                return;
            }
            
            await api.registerName(name);
            localStorage.setItem('vshift_callsign', name);
            gameState.transition(STATES.MAIN_MENU);
        } catch (e) {
            if (api.isOffline()) {
                localStorage.setItem('vshift_callsign', name);
                gameState.transition(STATES.MAIN_MENU);
            } else {
                this.errorText.innerText = 'Server error. Is the backend running?';
                this.button.disabled = false;
                this.button.innerText = 'CONFIRM';
                return;
            }
        }

        this.button.disabled = false;
        this.button.innerText = 'CONFIRM';
    }

    show(payload) {
        this.container.style.display = 'flex';
        this.offlineNotice.style.display = api.isOffline() ? 'block' : 'none';
        this.input.focus();
    }

    hide() {
        this.container.style.display = 'none';
    }
}

export default NameSelect;
