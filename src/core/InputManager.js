import engine from './Engine.js';
import gameState, { STATES } from './GameState.js';

class InputManager {
    constructor() {
        this.keys = new Map();
        
        // Mouse look data
        this.mouseDelta = { x: 0, y: 0 };
        this.isLocked = false;
        
        // Mouse buttons
        this.mouseButtons = new Map(); // 0: left, 1: middle, 2: right

        // Gamepad state (written to by GamepadManager)
        this.gamepadActive = false;
        this.gamepadMove = { x: 0, z: 0 };
        this.gamepadLook = { x: 0, y: 0 };
        this.gamepadCrouchHeld = false;

        // Touch state (written to by TouchControls)
        this.touchActive = false;
        this.touchMove = { x: 0, z: 0 };
        this.touchLook = { x: 0, y: 0 };
        this.touchCrouchHeld = false;

        this.bindEvents();
    }

    bindEvents() {
        // Keyboard mapping
        document.addEventListener('keydown', (e) => {
            if (e.repeat) return;
            this.keys.set(e.code, true);

            // Custom event dispatcher based on key
            if (e.code === 'Space') window.dispatchEvent(new CustomEvent('onJump'));
            if (e.code === 'KeyC' || e.code === 'ControlLeft') window.dispatchEvent(new CustomEvent('onCrouch'));
            if (e.code === 'KeyR') window.dispatchEvent(new CustomEvent('onReload'));
            if (e.code === 'KeyF') window.dispatchEvent(new CustomEvent('onInspectWeapon'));
            if (e.code === 'KeyB') window.dispatchEvent(new CustomEvent('onBuyMenu'));
            if (e.code === 'Tab') {
                e.preventDefault();
                window.dispatchEvent(new CustomEvent('onScoreboardShow'));
            }
            
            // Weapon switching hooks
            if (e.code.startsWith('Digit') && e.code.length === 6) {
                const slot = parseInt(e.code.charAt(5));
                if (slot >= 1 && slot <= 6) {
                    window.dispatchEvent(new CustomEvent('onWeaponSwitch', { detail: slot }));
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys.set(e.code, false);
            if (e.code === 'Tab') {
                e.preventDefault();
                window.dispatchEvent(new CustomEvent('onScoreboardHide'));
            }
        });

        // Mouse Button mapping
        document.addEventListener('mousedown', (e) => {
            this.mouseButtons.set(e.button, true);
            
            const canvas = engine.getCanvas();
            // Only acquire pointer lock when in PLAYING state
            if (canvas && document.pointerLockElement !== canvas) {
                if (this._shouldLockPointer()) {
                    canvas.requestPointerLock();
                }
            } else if (this.isLocked) {
                if (e.button === 0) window.dispatchEvent(new CustomEvent('onShootPrimary'));
                if (e.button === 2) window.dispatchEvent(new CustomEvent('onShootSecondary'));
            }
        });

        document.addEventListener('mouseup', (e) => {
            this.mouseButtons.set(e.button, false);
        });

        // Mouse Movement (only recorded if pointer is locked)
        document.addEventListener('mousemove', (e) => {
            if (this.isLocked) {
                this.mouseDelta.x += e.movementX;
                this.mouseDelta.y += e.movementY;
            }
        });

        // Pointer Lock State Changes
        document.addEventListener('pointerlockchange', () => {
            this.isLocked = (document.pointerLockElement === engine.getCanvas());
        });
    }

    isKeyDown(code) {
        return !!this.keys.get(code);
    }

    isMouseDown(button) {
        return !!this.mouseButtons.get(button);
    }

    /**
     * Gets the accumulated look delta from mouse, gamepad, and touch since last call.
     * Resets accumulated values. Called once per frame by the PlayerController.
     */
    getMouseDelta() {
        const delta = {
            x: this.mouseDelta.x + this.gamepadLook.x + this.touchLook.x,
            y: this.mouseDelta.y + this.gamepadLook.y + this.touchLook.y
        };
        this.mouseDelta.x = 0;
        this.mouseDelta.y = 0;
        this.gamepadLook.x = 0;
        this.gamepadLook.y = 0;
        this.touchLook.x = 0;
        this.touchLook.y = 0;
        return delta;
    }

    /**
     * Returns combined movement axes from keyboard, gamepad, and touch.
     * Values are normalized to the unit circle (-1 to 1 per axis).
     */
    getMovementAxes() {
        let x = 0, z = 0;

        // Keyboard (binary)
        if (this.isKeyDown('KeyA')) x -= 1;
        if (this.isKeyDown('KeyD')) x += 1;
        if (this.isKeyDown('KeyW')) z -= 1;
        if (this.isKeyDown('KeyS')) z += 1;

        // Gamepad left stick (analog)
        x += this.gamepadMove.x;
        z += this.gamepadMove.z;

        // Touch joystick (analog)
        x += this.touchMove.x;
        z += this.touchMove.z;

        // Clamp to unit circle
        const len = Math.sqrt(x * x + z * z);
        if (len > 1) { x /= len; z /= len; }

        return { x, z };
    }

    /**
     * Returns true when any input source is actively providing input
     * (pointer locked, gamepad connected, or touch controls active).
     */
    isInputActive() {
        return this.isLocked || this.gamepadActive || this.touchActive;
    }

    /**
     * Returns true if crouch is held on any input source.
     * KeyC and ControlLeft are both mapped to crouch (matching keyboard event bindings).
     */
    isCrouching() {
        return this.isKeyDown('KeyC') || this.isKeyDown('ControlLeft')
            || this.gamepadCrouchHeld || this.touchCrouchHeld;
    }

    _shouldLockPointer() {
        return gameState.currentState === STATES.PLAYING;
    }
}

const inputManager = new InputManager();
export default inputManager;
