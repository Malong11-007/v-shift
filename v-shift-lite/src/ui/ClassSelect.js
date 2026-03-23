import gameState, { STATES } from '../core/GameState.js';

class ClassSelect {
    constructor() {
        this.container = document.createElement('div');
        this.container.style.position = 'absolute';
        this.container.style.top = '0';
        this.container.style.left = '0';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.backgroundColor = 'rgba(10, 10, 10, 0.9)';
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';
        this.container.style.alignItems = 'center';
        this.container.style.paddingTop = '60px';
        this.container.style.color = '#fff';
        this.container.style.fontFamily = 'Inter, sans-serif';
        this.container.style.zIndex = '1000';
        this.container.style.pointerEvents = 'auto';

        // Header
        const header = document.createElement('div');
        header.style.width = '100%';
        header.style.maxWidth = '1000px';
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.marginBottom = '40px';

        const title = document.createElement('h2');
        title.innerText = 'SELECT ARCHETYPE & LOADOUT';
        title.style.fontSize = '28px';
        title.style.letterSpacing = '3px';
        title.style.textShadow = '0 0 10px #00f0ff';
        header.appendChild(title);

        const backBtn = document.createElement('button');
        backBtn.innerText = '← BACK';
        backBtn.style.padding = '8px 16px';
        backBtn.style.backgroundColor = 'transparent';
        backBtn.style.color = '#aaa';
        backBtn.style.border = '1px solid #555';
        backBtn.style.cursor = 'pointer';
        backBtn.style.fontWeight = 'bold';
        backBtn.addEventListener('click', () => gameState.transition(STATES.MODE_SELECT));
        header.appendChild(backBtn);

        this.container.appendChild(header);

        // Archetype Cards
        this.archContainer = document.createElement('div');
        this.archContainer.style.display = 'flex';
        this.archContainer.style.gap = '20px';
        this.archContainer.style.maxWidth = '1000px';
        this.archContainer.style.marginBottom = '40px';
        this.archContainer.style.width = '100%';
        this.container.appendChild(this.archContainer);

        this.selectedArchetype = 'KINETIC';
        this.archetypeCards = [];

        this.createArchetypeCard('KINETIC', 'Movement Specialist', '- +2 Frame B-Hop Window\n- Light Footsteps');
        this.createArchetypeCard('STATIC', 'Anchor & Defense', '- 50% Visual Flinch\n- Heavy Armor Bonus');
        this.createArchetypeCard('GHOST', 'Infiltration', '- Silent Slides\n- Invisible to Radar');

        // Weapon Select
        this.weaponContainer = document.createElement('div');
        this.weaponContainer.style.display = 'flex';
        this.weaponContainer.style.flexDirection = 'column';
        this.weaponContainer.style.alignItems = 'center';
        this.weaponContainer.style.backgroundColor = '#151515';
        this.weaponContainer.style.border = '1px solid #333';
        this.weaponContainer.style.padding = '20px';
        this.weaponContainer.style.width = '100%';
        this.weaponContainer.style.maxWidth = '1000px';
        this.weaponContainer.style.marginBottom = '40px';
        this.container.appendChild(this.weaponContainer);

        const wepTitle = document.createElement('h3');
        wepTitle.innerText = 'PRIMARY WEAPON';
        wepTitle.style.marginBottom = '15px';
        wepTitle.style.color = '#ccc';
        this.weaponContainer.appendChild(wepTitle);

        this.wepSelect = document.createElement('select');
        this.wepSelect.style.padding = '10px';
        this.wepSelect.style.fontSize = '18px';
        this.wepSelect.style.backgroundColor = '#222';
        this.wepSelect.style.color = '#fff';
        this.wepSelect.style.border = '1px solid #00f0ff';
        this.wepSelect.style.outline = 'none';
        this.wepSelect.style.width = '300px';
        ['V44Sabre', 'Cinch9', 'Breach12', 'Bolt88'].forEach(w => {
            const opt = document.createElement('option');
            opt.value = w;
            opt.innerText = w;
            this.wepSelect.appendChild(opt);
        });
        this.weaponContainer.appendChild(this.wepSelect);

        // Deploy Button
        this.deployBtn = document.createElement('button');
        this.deployBtn.innerText = 'DEPLOY TO ARENA';
        this.deployBtn.style.padding = '20px 60px';
        this.deployBtn.style.fontSize = '24px';
        this.deployBtn.style.fontWeight = '800';
        this.deployBtn.style.backgroundColor = '#00f0ff';
        this.deployBtn.style.color = '#000';
        this.deployBtn.style.border = 'none';
        this.deployBtn.style.borderRadius = '4px';
        this.deployBtn.style.cursor = 'pointer';
        this.deployBtn.style.letterSpacing = '4px';
        this.deployBtn.style.boxShadow = '0 0 20px rgba(0,240,255,0.4)';
        
        this.deployBtn.addEventListener('mouseenter', () => this.deployBtn.style.backgroundColor = '#fff');
        this.deployBtn.addEventListener('mouseleave', () => this.deployBtn.style.backgroundColor = '#00f0ff');
        
        this.deployBtn.addEventListener('click', () => {
            // Store selected archetype/weapon in localStorage or simple variable
            window.selectedArchetype = this.selectedArchetype;
            window.selectedPrimary = this.wepSelect.value;
            
            // Go to playing!
            gameState.transition(STATES.PLAYING);
        });
        
        this.container.appendChild(this.deployBtn);
    }

    createArchetypeCard(name, desc, traits) {
        const card = document.createElement('div');
        card.style.flex = '1';
        card.style.backgroundColor = '#1a1a1a';
        card.style.border = '2px solid ' + (this.selectedArchetype === name ? '#00f0ff' : '#333');
        card.style.borderRadius = '8px';
        card.style.padding = '20px';
        card.style.cursor = 'pointer';
        card.style.transition = 'all 0.2s';
        
        card.addEventListener('click', () => {
            this.selectedArchetype = name;
            this.archetypeCards.forEach(c => c.style.borderColor = '#333');
            card.style.borderColor = '#00f0ff';
        });

        const title = document.createElement('h3');
        title.innerText = name;
        title.style.fontSize = '22px';
        title.style.marginBottom = '10px';
        title.style.color = (this.selectedArchetype === name ? '#00f0ff' : '#fff');
        card.appendChild(title);

        const sub = document.createElement('div');
        sub.innerText = desc;
        sub.style.color = '#bbb';
        sub.style.marginBottom = '15px';
        sub.style.fontSize = '14px';
        card.appendChild(sub);

        const trt = document.createElement('pre');
        trt.innerText = traits;
        trt.style.color = '#888';
        trt.style.fontSize = '13px';
        trt.style.fontFamily = 'Inter, sans-serif';
        trt.style.whiteSpace = 'pre-wrap';
        card.appendChild(trt);

        this.archContainer.appendChild(card);
        this.archetypeCards.push(card);
    }

    show(payload) {
        this.container.style.display = 'flex';
    }

    hide() {
        this.container.style.display = 'none';
    }
}

export default ClassSelect;
