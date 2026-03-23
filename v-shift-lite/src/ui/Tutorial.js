import gameState, { STATES } from '../core/GameState.js';

class Tutorial {
    constructor() {
        this.container = document.createElement('div');
        this.container.id = 'tutorial-hud';
        this.applyStyles();
        
        this.steps = [
            { id: 'move', text: 'USE WASD TO CALIBRATE MOVEMENT', check: 'isMoving' },
            { id: 'jump', text: 'PRESS SPACE FOR KINETIC BOOST', check: 'isJumping' },
            { id: 'shoot', text: 'ELIMINATE THE TARGET (LEFT CLICK)', check: 'hasShot' },
            { id: 'switch', text: 'SWITCH TO KNIFE (PRESS 3) TO RUN FASTER', check: 'switchedMelee' },
            { id: 'complete', text: 'TUTORIAL COMPLETE. DEPLOY TO FIELD.', check: null }
        ];
        
        this.currentStepIndex = 0;
        this.messageEl = document.createElement('div');
        this.applyMessageStyles(this.messageEl);
        this.container.appendChild(this.messageEl);
        
        document.body.appendChild(this.container);
        this.hide();

        // Internal flags for checks
        this.flags = {
            isMoving: false,
            isJumping: false,
            hasShot: false,
            switchedMelee: false
        };

        this.initListeners();
    }

    applyStyles() {
        Object.assign(this.container.style, {
            position: 'absolute',
            top: '20%', left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: '1500',
            textAlign: 'center'
        });
    }

    applyMessageStyles(el) {
        Object.assign(el.style, {
            fontSize: '18px',
            color: '#00f0ff',
            letterSpacing: '4px',
            padding: '10px 40px',
            backgroundColor: 'rgba(0,0,0,0.7)',
            border: '2px solid #00f0ff',
            boxShadow: '0 0 20px rgba(0,240,255,0.4)',
            transition: 'all 0.3s ease'
        });
    }

    initListeners() {
        window.addEventListener('keydown', (e) => {
            if (['KeyW','KeyA','KeyS','KeyD'].includes(e.code)) this.flags.isMoving = true;
            if (e.code === 'Space') this.flags.isJumping = true;
            if (e.code === 'Digit3') this.flags.switchedMelee = true;
        });
        window.addEventListener('mousedown', () => this.flags.hasShot = true);
    }

    update(dt) {
        if (gameState.currentState !== STATES.PLAYING) {
            this.hide();
            return;
        }
        this.show();

        const step = this.steps[this.currentStepIndex];
        if (!step) return;

        this.messageEl.innerText = step.text;

        if (step.check && this.flags[step.check]) {
            this.advance();
        }
    }

    advance() {
        this.currentStepIndex++;
        if (this.currentStepIndex >= this.steps.length) {
            setTimeout(() => this.hide(), 3000);
        }
    }

    show() { this.container.style.display = 'block'; }
    hide() { this.container.style.display = 'none'; }
}

export default new Tutorial();
