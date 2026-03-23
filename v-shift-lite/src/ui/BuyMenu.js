import { WEAPONS } from '../weapons/WeaponData.js';
import economyManager from '../game/EconomyManager.js';
import roundManager, { ROUND_STATES } from '../game/RoundManager.js';
import engine from '../core/Engine.js';

class BuyMenu {
    constructor() {
        this.isOpen = false;
        
        this.createDOM();
        this.bindEvents();
    }

    createDOM() {
        this.container = document.createElement('div');
        this.container.id = 'buy-menu';
        this.container.style.display = 'none';
        this.container.style.position = 'absolute';
        this.container.style.top = '50%';
        this.container.style.left = '50%';
        this.container.style.transform = 'translate(-50%, -50%)';
        this.container.style.backgroundColor = 'rgba(20, 20, 30, 0.9)';
        this.container.style.border = '2px solid #00f0ff';
        this.container.style.padding = '20px';
        this.container.style.color = 'white';
        this.container.style.fontFamily = 'monospace';
        this.container.style.zIndex = '1000';
        this.container.style.pointerEvents = 'auto';
        
        const title = document.createElement('h2');
        title.innerText = 'BUY MENU [B]';
        title.style.margin = '0 0 20px 0';
        title.style.borderBottom = '1px solid #00f0ff';
        this.container.appendChild(title);

        this.cashDisplay = document.createElement('div');
        this.cashDisplay.style.marginBottom = '20px';
        this.cashDisplay.style.color = '#00ffaa';
        this.cashDisplay.style.fontSize = '24px';
        this.container.appendChild(this.cashDisplay);

        this.grid = document.createElement('div');
        this.grid.style.display = 'grid';
        this.grid.style.gridTemplateColumns = 'repeat(3, 1fr)';
        this.grid.style.gap = '10px';
        this.container.appendChild(this.grid);

        // Populate items
        Object.values(WEAPONS).forEach(weapon => {
            if (weapon.type === 'melee') return; // Don't buy knife
            
            const btn = document.createElement('button');
            btn.className = 'buy-btn';
            btn.dataset.id = weapon.id;
            btn.dataset.cost = weapon.cost;
            btn.innerHTML = `<strong>${weapon.name}</strong><br/>$${weapon.cost}`;
            btn.style.padding = '10px';
            btn.style.backgroundColor = '#2a2a35';
            btn.style.color = 'white';
            btn.style.border = '1px solid #444';
            btn.style.cursor = 'pointer';
            
            btn.addEventListener('click', () => this.buyWeapon(weapon));
            this.grid.appendChild(btn);
        });

        document.getElementById('ui-root').appendChild(this.container);
    }

    bindEvents() {
        window.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'b') {
                this.toggle();
            }
        });

        window.addEventListener('cashChanged', () => {
            if (this.isOpen) this.updateUI();
        });
        
        window.addEventListener('roundStateChanged', (e) => {
            // Auto close if round goes LIVE
            if (e.detail.state !== ROUND_STATES.FREEZE_TIME && this.isOpen) {
                this.close();
            }
        });
    }

    toggle() {
        if (roundManager.state !== ROUND_STATES.FREEZE_TIME) {
            console.log('Cannot open buy menu outside of freeze time.');
            return;
        }
        
        this.isOpen = !this.isOpen;
        this.container.style.display = this.isOpen ? 'block' : 'none';
        
        if (this.isOpen) {
            this.updateUI();
            document.exitPointerLock(); // Free mouse to click
        } else {
            engine.canvas.requestPointerLock();
        }
    }
    
    close() {
        this.isOpen = false;
        this.container.style.display = 'none';
        if (document.pointerLockElement !== engine.canvas) {
            engine.canvas.requestPointerLock();
        }
    }

    updateUI() {
        this.cashDisplay.innerText = `$${economyManager.cash}`;
        
        const btns = this.grid.querySelectorAll('.buy-btn');
        btns.forEach(btn => {
            const cost = parseInt(btn.dataset.cost);
            if (economyManager.cash >= cost) {
                btn.style.opacity = '1.0';
                btn.style.borderColor = '#00f0ff';
                btn.disabled = false;
            } else {
                btn.style.opacity = '0.5';
                btn.style.borderColor = '#444';
                btn.disabled = true;
            }
        });
    }

    buyWeapon(weapon) {
        if (economyManager.spendCash(weapon.cost)) {
            console.log(`Bought ${weapon.name}`);
            window.dispatchEvent(new CustomEvent('weaponPurchased', { detail: weapon }));
            // Could auto-close here if desired
        }
    }
}

const buyMenu = new BuyMenu();
export default buyMenu;
