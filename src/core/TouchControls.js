import input from './InputManager.js';

/**
 * Touch controls overlay for mobile devices.
 * Left side: virtual joystick for movement.
 * Right side: touch-look area + action buttons (fire, jump, reload, crouch).
 * Only created on touch-capable devices.
 */
class TouchControls {
    constructor() {
        this.active = false;
        this.isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

        // Joystick tracking
        this.joyTouchId = null;
        this.joyOrigin = null;
        this.joystickRadius = 50;

        // Look tracking
        this.lookTouchId = null;
        this.lastLookPos = null;

        // DOM references
        this.container = null;
        this.joystickBase = null;
        this.joystickKnob = null;

        if (this.isTouchDevice) {
            this.createUI();
            this.bindEvents();
        }
    }

    createUI() {
        this.container = document.createElement('div');
        this.container.id = 'touch-controls';
        Object.assign(this.container.style, {
            position: 'absolute',
            top: '0', left: '0',
            width: '100%', height: '100%',
            pointerEvents: 'none',
            zIndex: '1500',
            display: 'none'
        });

        // --- Movement Joystick Area (left 40%) ---
        this.joystickArea = document.createElement('div');
        Object.assign(this.joystickArea.style, {
            position: 'absolute',
            left: '0', bottom: '0',
            width: '40%', height: '50%',
            pointerEvents: 'auto',
            touchAction: 'none'
        });

        this.joystickBase = document.createElement('div');
        Object.assign(this.joystickBase.style, {
            position: 'absolute',
            left: '80px', bottom: '80px',
            width: '120px', height: '120px',
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.3)',
            backgroundColor: 'rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        });

        this.joystickKnob = document.createElement('div');
        Object.assign(this.joystickKnob.style, {
            width: '50px', height: '50px',
            borderRadius: '50%',
            backgroundColor: 'rgba(0,240,255,0.5)',
            border: '2px solid rgba(0,240,255,0.7)'
        });

        this.joystickBase.appendChild(this.joystickKnob);
        this.joystickArea.appendChild(this.joystickBase);
        this.container.appendChild(this.joystickArea);

        // --- Look Area (right 60%, full height) ---
        this.lookArea = document.createElement('div');
        Object.assign(this.lookArea.style, {
            position: 'absolute',
            right: '0', top: '0',
            width: '60%', height: '100%',
            pointerEvents: 'auto',
            touchAction: 'none'
        });
        this.container.appendChild(this.lookArea);

        // --- Action Buttons ---
        this.shootBtn = this.createActionButton('FIRE', { right: '30px', bottom: '120px' }, '#ff0055', 60);
        this.jumpBtn = this.createActionButton('\u25B2', { right: '120px', bottom: '50px' }, '#00f0ff', 50);
        this.reloadBtn = this.createActionButton('R', { right: '120px', bottom: '190px' }, '#ffaa00', 40);
        this.crouchBtn = this.createActionButton('C', { right: '200px', bottom: '50px' }, '#88ff00', 40);

        this.container.appendChild(this.shootBtn);
        this.container.appendChild(this.jumpBtn);
        this.container.appendChild(this.reloadBtn);
        this.container.appendChild(this.crouchBtn);

        document.body.appendChild(this.container);
    }

    createActionButton(label, position, color, size) {
        const btn = document.createElement('div');
        Object.assign(btn.style, {
            position: 'absolute',
            ...position,
            width: `${size}px`, height: `${size}px`,
            borderRadius: '50%',
            border: `2px solid ${color}`,
            backgroundColor: `${color}33`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: size > 50 ? '14px' : '12px',
            fontWeight: 'bold',
            fontFamily: '"Inter", sans-serif',
            pointerEvents: 'auto',
            touchAction: 'none',
            userSelect: 'none'
        });
        btn.innerText = label;
        return btn;
    }

    bindEvents() {
        // --- Joystick ---
        this.joystickArea.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.changedTouches[0];
            this.joyTouchId = touch.identifier;
            const rect = this.joystickBase.getBoundingClientRect();
            this.joyOrigin = {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            };
        }, { passive: false });

        this.joystickArea.addEventListener('touchmove', (e) => {
            e.preventDefault();
            for (const touch of e.changedTouches) {
                if (touch.identifier === this.joyTouchId) {
                    this.updateJoystick(touch.clientX, touch.clientY);
                }
            }
        }, { passive: false });

        const joystickEnd = (e) => {
            for (const touch of e.changedTouches) {
                if (touch.identifier === this.joyTouchId) {
                    this.resetJoystick();
                }
            }
        };
        this.joystickArea.addEventListener('touchend', joystickEnd, { passive: false });
        this.joystickArea.addEventListener('touchcancel', joystickEnd, { passive: false });

        // --- Look Area ---
        this.lookArea.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.lookTouchId !== null) return;
            const touch = e.changedTouches[0];
            this.lookTouchId = touch.identifier;
            this.lastLookPos = { x: touch.clientX, y: touch.clientY };
        }, { passive: false });

        this.lookArea.addEventListener('touchmove', (e) => {
            e.preventDefault();
            for (const touch of e.changedTouches) {
                if (touch.identifier === this.lookTouchId && this.lastLookPos) {
                    const dx = touch.clientX - this.lastLookPos.x;
                    const dy = touch.clientY - this.lastLookPos.y;
                    input.touchLook.x += dx;
                    input.touchLook.y += dy;
                    this.lastLookPos = { x: touch.clientX, y: touch.clientY };
                }
            }
        }, { passive: false });

        const lookEnd = (e) => {
            for (const touch of e.changedTouches) {
                if (touch.identifier === this.lookTouchId) {
                    this.lookTouchId = null;
                    this.lastLookPos = null;
                }
            }
        };
        this.lookArea.addEventListener('touchend', lookEnd, { passive: false });
        this.lookArea.addEventListener('touchcancel', lookEnd, { passive: false });

        // --- Action Buttons ---
        this.shootBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            window.dispatchEvent(new CustomEvent('onShootPrimary'));
        }, { passive: false });

        this.jumpBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            window.dispatchEvent(new CustomEvent('onJump'));
        }, { passive: false });

        this.reloadBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            window.dispatchEvent(new CustomEvent('onReload'));
        }, { passive: false });

        this.crouchBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            window.dispatchEvent(new CustomEvent('onCrouch'));
            input.touchCrouchHeld = true;
        }, { passive: false });
        this.crouchBtn.addEventListener('touchend', () => {
            input.touchCrouchHeld = false;
        });
        this.crouchBtn.addEventListener('touchcancel', () => {
            input.touchCrouchHeld = false;
        });

        // Show/hide based on game state
        window.addEventListener('gameStateChange', (e) => {
            if (e.detail.current === 'PLAYING') {
                this.show();
            } else {
                this.hide();
            }
        });
    }

    updateJoystick(touchX, touchY) {
        if (!this.joyOrigin) return;

        let dx = touchX - this.joyOrigin.x;
        let dy = touchY - this.joyOrigin.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = this.joystickRadius;

        if (dist > maxDist) {
            dx = (dx / dist) * maxDist;
            dy = (dy / dist) * maxDist;
        }

        this.joystickKnob.style.transform = `translate(${dx}px, ${dy}px)`;

        input.touchMove.x = dx / maxDist;
        input.touchMove.z = dy / maxDist;
    }

    resetJoystick() {
        this.joyTouchId = null;
        this.joyOrigin = null;
        if (this.joystickKnob) {
            this.joystickKnob.style.transform = 'translate(0, 0)';
        }
        input.touchMove.x = 0;
        input.touchMove.z = 0;
    }

    show() {
        if (this.container) {
            this.container.style.display = 'block';
            this.active = true;
            input.touchActive = true;
        }
    }

    hide() {
        if (this.container) {
            this.container.style.display = 'none';
            this.active = false;
            input.touchActive = false;
            this.resetJoystick();
            this.lookTouchId = null;
            this.lastLookPos = null;
        }
    }
}

const touchControls = new TouchControls();
export default touchControls;
