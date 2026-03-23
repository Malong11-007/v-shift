import gameState, { STATES } from '../core/GameState.js';
import api from '../utils/API.js';

class Leaderboard {
    constructor() {
        this.container = document.createElement('div');
        this.container.style.position = 'absolute';
        this.container.style.top = '0';
        this.container.style.left = '0';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.backgroundColor = 'rgba(10, 10, 10, 0.98)';
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';
        this.container.style.alignItems = 'center';
        this.container.style.color = '#fff';
        this.container.style.fontFamily = 'Inter, sans-serif';
        this.container.style.zIndex = '2000';
        this.container.style.padding = '80px 20px';
        this.container.style.overflowY = 'auto';

        this.title = document.createElement('h2');
        this.title.innerText = 'GLOBAL LEADERBOARD';
        this.title.style.fontSize = '40px';
        this.title.style.letterSpacing = '5px';
        this.title.style.marginBottom = '10px';
        this.title.style.textShadow = '0 0 15px #00f0ff';
        this.container.appendChild(this.title);

        this.subtitle = document.createElement('p');
        this.subtitle.innerText = 'TOP PERFORMING OPERATORS';
        this.subtitle.style.fontSize = '14px';
        this.subtitle.style.color = '#555';
        this.subtitle.style.letterSpacing = '3px';
        this.subtitle.style.marginBottom = '40px';
        this.container.appendChild(this.subtitle);

        // List Container
        this.list = document.createElement('div');
        this.list.style.width = '100%';
        this.list.style.maxWidth = '800px';
        this.list.style.display = 'flex';
        this.list.style.flexDirection = 'column';
        this.list.style.gap = '5px';
        this.container.appendChild(this.list);

        this.loading = document.createElement('p');
        this.loading.innerText = 'SYNCHRONIZING RECORDS...';
        this.loading.style.color = '#00f0ff';
        this.loading.style.marginTop = '20px';
        this.container.appendChild(this.loading);

        this.backBtn = document.createElement('button');
        this.backBtn.innerText = 'RETURN TO BASE';
        this.backBtn.style.marginTop = '40px';
        this.backBtn.style.padding = '15px 50px';
        this.backBtn.style.fontSize = '18px';
        this.backBtn.style.fontWeight = 'bold';
        this.backBtn.style.backgroundColor = 'transparent';
        this.backBtn.style.color = '#ccc';
        this.backBtn.style.border = '2px solid #333';
        this.backBtn.style.cursor = 'pointer';
        this.backBtn.style.transition = 'all 0.2s';
        this.backBtn.addEventListener('click', () => {
            gameState.transition(STATES.MAIN_MENU);
        });
        this.container.appendChild(this.backBtn);
    }

    async refresh() {
        this.list.innerHTML = '';
        this.loading.style.display = 'block';
        
        try {
            const data = await api.getLeaderboard();
            this.loading.style.display = 'none';
            
            if (data.scores.length === 0) {
                this.list.innerHTML = '<p style="text-align:center;color:#444">NO COMBAT RECORDS FOUND</p>';
                return;
            }

            // Headers
            const header = this.createRow(['#', 'CALLSIGN', 'ARCHETYPE', 'SCORE'], true);
            this.list.appendChild(header);

            data.scores.forEach((s, i) => {
                const row = this.createRow([i + 1, s.callsign, s.archetype, s.score]);
                this.list.appendChild(row);
            });
        } catch (e) {
            this.loading.innerText = 'OFFLINE: BACKEND CONNECTION FAILED';
            this.loading.style.color = '#ff3333';
        }
    }

    createRow(cols, isHeader = false) {
        const row = document.createElement('div');
        row.style.display = 'grid';
        row.style.gridTemplateColumns = '50px 1fr 150px 150px';
        row.style.padding = '12px 20px';
        row.style.backgroundColor = isHeader ? 'transparent' : '#111';
        row.style.borderBottom = isHeader ? '1px solid #333' : 'none';
        row.style.color = isHeader ? '#00f0ff' : '#eee';
        row.style.fontSize = isHeader ? '12px' : '16px';
        row.style.fontWeight = isHeader ? 'bold' : 'normal';
        row.style.letterSpacing = isHeader ? '2px' : 'normal';

        cols.forEach(text => {
            const col = document.createElement('span');
            col.innerText = text;
            row.appendChild(col);
        });

        return row;
    }

    show(payload) {
        this.container.style.display = 'flex';
        this.refresh();
    }

    hide() {
        this.container.style.display = 'none';
    }
}

export default Leaderboard;
