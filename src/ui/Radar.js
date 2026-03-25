import engine from '../core/Engine.js';

class Radar {
    constructor() {
        this.container = document.createElement('div');
        this.container.id = 'radar-container';
        this.applyStyles();
        
        this.canvas = document.createElement('canvas');
        this.canvas.width = 150;
        this.canvas.height = 150;
        this.ctx = this.canvas.getContext('2d');
        this.container.appendChild(this.canvas);
        
        document.body.appendChild(this.container);
        
        this.scale = 1.5; // Pixels per meter
        this.range = 50;  // Meters visible
    }

    applyStyles() {
        Object.assign(this.container.style, {
            position: 'absolute',
            top: '20px',
            left: '20px',
            width: '150px',
            height: '150px',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            border: '2px solid rgba(0, 240, 255, 0.3)',
            borderRadius: '50%',
            overflow: 'hidden',
            zIndex: '100',
            boxShadow: '0 0 15px rgba(0, 0, 0, 0.5)',
            display: 'none'
        });
    }

    show() { this.container.style.display = 'block'; }
    hide() { this.container.style.display = 'none'; }

    update(player) {
        if (!player || !player.isAlive) {
            this.hide();
            return;
        }
        this.show();

        const ctx = this.ctx;
        const centerX = 75;
        const centerY = 75;
        
        ctx.clearRect(0, 0, 150, 150);
        
        // Draw Radar Grid
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.1)';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 37, 0, Math.PI * 2);
        ctx.arc(centerX, centerY, 74, 0, Math.PI * 2);
        ctx.stroke();

        const playerPos = player.camera.position;
        const playerYaw = player.yaw || 0;

        // Draw Entities (Bots/Remote Players)
        // We look for all objects with 'tag' or standard entities
        engine.updatables.forEach(ent => {
            if (ent === player || !ent.group || !ent.isAlive) return;
            
            const relX = ent.group.position.x - playerPos.x;
            const relZ = ent.group.position.z - playerPos.z;
            
            // Rotate relative to player heading
            const cos = Math.cos(-playerYaw);
            const sin = Math.sin(-playerYaw);
            const rotX = relX * cos - relZ * sin;
            const rotY = relX * sin + relZ * cos;
            
            const drawX = centerX + rotX * this.scale;
            const drawY = centerY + rotY * this.scale;
            
            // Boundary Check
            const distSq = (drawX - centerX)**2 + (drawY - centerY)**2;
            if (distSq < 72**2) {
                // Color based on type
                ctx.fillStyle = (ent.constructor.name === 'Bot') ? '#ff3333' : '#33ff33';
                ctx.beginPath();
                ctx.arc(drawX, drawY, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        // Draw Player (Center)
        ctx.fillStyle = '#00f0ff';
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - 6);
        ctx.lineTo(centerX - 4, centerY + 4);
        ctx.lineTo(centerX + 4, centerY + 4);
        ctx.closePath();
        ctx.fill();
    }
}

export default new Radar();
