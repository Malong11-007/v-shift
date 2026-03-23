import gameState, { STATES } from '../core/GameState.js';
import roomManager from '../net/RoomManager.js';

class Lobby {
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
        this.container.style.zIndex = '1500';
        this.container.style.pointerEvents = 'auto';

        this.title = document.createElement('h2');
        this.title.innerText = 'MATCH LOBBY';
        this.title.style.fontSize = '40px';
        this.title.style.letterSpacing = '5px';
        this.title.style.marginBottom = '20px';
        this.title.style.textShadow = '0 0 15px #00f0ff';
        this.container.appendChild(this.title);

        this.roomCode = document.createElement('p');
        this.roomCode.innerText = 'Room Code: [----]';
        this.roomCode.style.fontSize = '24px';
        this.roomCode.style.color = '#00f0ff';
        this.roomCode.style.marginBottom = '40px';
        this.roomCode.style.letterSpacing = '10px';
        this.container.appendChild(this.roomCode);

        // Player List Container
        this.playerList = document.createElement('div');
        this.playerList.style.width = '100%';
        this.playerList.style.maxWidth = '400px';
        this.playerList.style.marginBottom = '40px';
        this.playerList.style.display = 'flex';
        this.playerList.style.flexDirection = 'column';
        this.playerList.style.gap = '10px';
        this.container.appendChild(this.playerList);

        const btnContainer = document.createElement('div');
        btnContainer.style.display = 'flex';
        btnContainer.style.gap = '20px';

        this.leaveBtn = document.createElement('button');
        this.leaveBtn.innerText = 'LEAVE ROOM';
        this.leaveBtn.style.padding = '15px 30px';
        this.leaveBtn.style.fontSize = '18px';
        this.leaveBtn.style.backgroundColor = 'transparent';
        this.leaveBtn.style.color = '#ccc';
        this.leaveBtn.style.border = '2px solid #555';
        this.leaveBtn.style.cursor = 'pointer';
        this.leaveBtn.addEventListener('click', () => {
            roomManager.leaveRoom();
            gameState.transition(STATES.MODE_SELECT);
        });
        btnContainer.appendChild(this.leaveBtn);

        this.startBtn = document.createElement('button');
        this.startBtn.innerText = 'START MATCH';
        this.startBtn.style.padding = '15px 30px';
        this.startBtn.style.fontSize = '18px';
        this.startBtn.style.backgroundColor = '#00f0ff';
        this.startBtn.style.color = '#000';
        this.startBtn.style.border = 'none';
        this.startBtn.style.fontWeight = 'bold';
        this.startBtn.style.cursor = 'pointer';
        this.startBtn.addEventListener('click', () => {
            roomManager.startMatch();
        });
        btnContainer.appendChild(this.startBtn);

        this.container.appendChild(btnContainer);

        // Listen for updates
        window.addEventListener('roomCreated', () => this.updateUI());
        window.addEventListener('roomJoined', () => this.updateUI());
        window.addEventListener('roomPlayerJoined', () => this.updateUI());
        window.addEventListener('roomPlayerLeft', () => this.updateUI());
        window.addEventListener('matchStarted', () => {
            gameState.transition(STATES.CLASS_SELECT);
        });
    }

    updateUI() {
        this.roomCode.innerText = `Room Code: [${roomManager.roomCode}]`;
        
        // Update Start Button visibility
        this.startBtn.style.display = roomManager.isHost ? 'block' : 'none';
        
        // Update Player List
        this.playerList.innerHTML = '';
        roomManager.players.forEach((p, id) => {
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.justifyContent = 'space-between';
            row.style.padding = '10px 20px';
            row.style.backgroundColor = '#1a1a1a';
            row.style.borderLeft = id === roomManager.localPlayerId ? '4px solid #00f0ff' : '4px solid transparent';
            
            const nameEl = document.createElement('span');
            nameEl.innerText = p.name + (id === roomManager.localPlayerId ? ' (YOU)' : '');
            row.appendChild(nameEl);
            
            if (id === roomManager.hostId || (roomManager.isHost && id === roomManager.localPlayerId)) {
                const hostTag = document.createElement('span');
                hostTag.innerText = 'HOST';
                hostTag.style.color = '#00f0ff';
                hostTag.style.fontSize = '12px';
                row.appendChild(hostTag);
            }
            
            this.playerList.appendChild(row);
        });
    }

    show(payload) {
        this.container.style.display = 'flex';
        this.updateUI();
    }

    hide() {
        this.container.style.display = 'none';
    }
}

export default Lobby;
