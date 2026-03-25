import gameState, { STATES } from '../core/GameState.js';
import matchManager, { GAME_MODES } from '../game/MatchManager.js';
import networkManager from '../net/NetworkManager.js';
import roomManager from '../net/RoomManager.js';

class ModeSelect {
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
        this.container.style.paddingTop = '100px';
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
        header.style.marginBottom = '60px';

        const title = document.createElement('h2');
        title.innerText = 'SELECT DEPLOYMENT MODE';
        title.style.fontSize = '36px';
        title.style.letterSpacing = '4px';
        title.style.textShadow = '0 0 10px #00f0ff';
        header.appendChild(title);

        const backBtn = document.createElement('button');
        backBtn.innerText = '← BACK';
        backBtn.style.padding = '10px 20px';
        backBtn.style.backgroundColor = 'transparent';
        backBtn.style.color = '#aaa';
        backBtn.style.border = '1px solid #555';
        backBtn.style.cursor = 'pointer';
        backBtn.style.fontFamily = 'Inter, sans-serif';
        backBtn.style.fontWeight = 'bold';
        backBtn.addEventListener('click', () => gameState.transition(STATES.MAIN_MENU));
        header.appendChild(backBtn);

        this.container.appendChild(header);

        // Cards Container
        this.cardsContainer = document.createElement('div');
        this.cardsContainer.style.display = 'flex';
        this.cardsContainer.style.gap = '30px';
        this.cardsContainer.style.maxWidth = '1000px';
        this.container.appendChild(this.cardsContainer);

        // CREATE CARDS
        this.createCard(
            'SOLO TRAINING',
            'Full 5v5 match with AI bots on both teams. Perfect for practicing tactics and gameplay.',
            'DEPLOY NOW',
            () => {
                matchManager.setMode(GAME_MODES.DEATHMATCH); // Or solo mode
                gameState.transition(STATES.CLASS_SELECT);
            }
        );

        this.createCard(
            'CREATE ROOM', 
            'Host an authoritative local instance. Friends can connect via a room code.',
            'HOST GAME',
            async () => {
                try {
                    await this.ensureConnected();
                    const name = localStorage.getItem('vshift_callsign') || 'Player';
                    roomManager.createRoom(`${name}'s Room`);
                    gameState.transition(STATES.LOBBY);
                } catch (e) {
                    alert('Could not connect to server: ' + e.message);
                }
            }
        );

        this.createJoinCard();
    }

    async ensureConnected() {
        if (!networkManager.connected) {
            const serverUrl = window.location.hostname === 'localhost' ? 'ws://localhost:3000' : `ws://${window.location.hostname}`;
            await networkManager.connect(serverUrl);
        }
    }

    createCard(titleText, descText, btnText, onClick) {
        const card = document.createElement('div');
        card.style.flex = '1';
        card.style.backgroundColor = '#1a1a1a';
        card.style.border = '1px solid #333';
        card.style.borderRadius = '8px';
        card.style.padding = '40px 30px';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.alignItems = 'center';
        card.style.transition = 'all 0.2s';
        
        card.addEventListener('mouseenter', () => {
            card.style.borderColor = '#00f0ff';
            card.style.transform = 'translateY(-5px)';
            card.style.boxShadow = '0 10px 30px rgba(0, 240, 255, 0.1)';
        });
        card.addEventListener('mouseleave', () => {
            card.style.borderColor = '#333';
            card.style.transform = 'translateY(0)';
            card.style.boxShadow = 'none';
        });

        const h3 = document.createElement('h3');
        h3.innerText = titleText;
        h3.style.fontSize = '24px'; // Retained original fontSize
        h3.style.marginBottom = '15px'; // Changed from 20px
        h3.style.letterSpacing = '2px'; // Retained original letterSpacing
        card.appendChild(h3);

        const p = document.createElement('p');
        p.innerText = descText;
        p.style.color = '#888'; // Retained original color
        p.style.lineHeight = '1.6'; // Retained original lineHeight
        p.style.textAlign = 'center';
        p.style.marginBottom = '40px'; // Retained original marginBottom
        p.style.flex = '1'; // Retained original flex
        card.appendChild(p);

        const btn = document.createElement('button');
        btn.innerText = btnText;
        btn.style.width = '100%';
        btn.style.padding = '15px 0'; // Retained original padding
        btn.style.backgroundColor = '#333'; // Retained original backgroundColor
        btn.style.color = '#fff'; // Retained original color
        btn.style.border = 'none';
        btn.style.fontWeight = 'bold';
        btn.style.letterSpacing = '2px'; // Retained original letterSpacing
        btn.style.cursor = 'pointer';
        btn.style.transition = 'background 0.2s';
        
        btn.addEventListener('mouseenter', () => btn.style.backgroundColor = '#00f0ff');
        btn.addEventListener('mouseenter', () => btn.style.color = '#000');
        btn.addEventListener('mouseleave', () => btn.style.backgroundColor = '#333');
        btn.addEventListener('mouseleave', () => btn.style.color = '#fff');
        
        btn.addEventListener('click', onClick);
        card.appendChild(btn);

        this.cardsContainer.appendChild(card);
    }

    createJoinCard() {
        const card = document.createElement('div');
        card.style.flex = '1';
        card.style.backgroundColor = '#1a1a1a';
        card.style.border = '1px solid #333';
        card.style.borderRadius = '8px';
        card.style.padding = '40px 30px';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.alignItems = 'center';
        card.style.transition = 'all 0.2s';
        
        card.addEventListener('mouseenter', () => {
            card.style.borderColor = '#00f0ff';
            card.style.transform = 'translateY(-5px)';
            card.style.boxShadow = '0 10px 30px rgba(0, 240, 255, 0.1)';
        });
        card.addEventListener('mouseleave', () => {
            card.style.borderColor = '#333';
            card.style.transform = 'translateY(0)';
            card.style.boxShadow = 'none';
        });

        const title = document.createElement('h3');
        title.innerText = 'JOIN ROOM';
        title.style.fontSize = '24px';
        title.style.marginBottom = '20px';
        title.style.letterSpacing = '2px';
        card.appendChild(title);

        const desc = document.createElement('p');
        desc.innerText = 'Enter a 4-character room code to join an active game.';
        desc.style.color = '#888';
        desc.style.lineHeight = '1.6';
        desc.style.textAlign = 'center';
        desc.style.marginBottom = '20px';
        card.appendChild(desc);

        // Code Input
        const input = document.createElement('input');
        input.type = 'text';
        input.maxLength = 4;
        input.placeholder = 'CODE';
        input.style.width = '100%';
        input.style.padding = '15px';
        input.style.boxSizing = 'border-box';
        input.style.fontSize = '20px';
        input.style.textAlign = 'center';
        input.style.letterSpacing = '10px';
        input.style.textTransform = 'uppercase';
        input.style.backgroundColor = '#111';
        input.style.color = '#fff';
        input.style.border = '1px solid #555';
        input.style.marginBottom = '15px';
        input.style.outline = 'none';
        
        input.addEventListener('focus', () => input.style.borderColor = '#00f0ff');
        input.addEventListener('blur', () => input.style.borderColor = '#555');
        
        card.appendChild(input);

        const btn = document.createElement('button');
        btn.innerText = 'CONNECT';
        btn.style.width = '100%';
        btn.style.padding = '15px 0';
        btn.style.backgroundColor = '#333';
        btn.style.color = '#fff';
        btn.style.border = 'none';
        btn.style.fontWeight = 'bold';
        btn.style.letterSpacing = '2px';
        btn.style.cursor = 'pointer';
        btn.style.transition = 'background 0.2s';
        
        btn.addEventListener('mouseenter', () => btn.style.backgroundColor = '#00f0ff');
        btn.addEventListener('mouseenter', () => btn.style.color = '#000');
        btn.addEventListener('mouseleave', () => btn.style.backgroundColor = '#333');
        btn.addEventListener('mouseleave', () => btn.style.color = '#fff');
        
        btn.addEventListener('click', async () => {
            const code = input.value.toUpperCase();
            if (code.length === 4) {
                try {
                    await this.ensureConnected();
                    const name = localStorage.getItem('vshift_callsign') || 'Player';
                    roomManager.joinRoom(code, name);
                    gameState.transition(STATES.LOBBY);
                } catch (e) {
                    alert('Could not join room: ' + e.message);
                }
            }
        });
        card.appendChild(btn);

        this.cardsContainer.appendChild(card);
    }

    show(payload) {
        this.container.style.display = 'flex';
    }

    hide() {
        this.container.style.display = 'none';
    }
}

export default ModeSelect;
