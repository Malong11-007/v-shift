import input from './InputManager.js';
import gameState, { STATES } from './GameState.js';

/**
 * Polls the Gamepad API each frame and maps standard gamepad buttons/axes
 * to game input events and InputManager state.
 *
 * Standard Gamepad Layout:
 *   Left Stick  (axes 0,1):  Movement
 *   Right Stick (axes 2,3):  Camera look
 *   A / Cross   (btn 0):    Jump
 *   B / Circle  (btn 1):    Crouch / Slide
 *   X / Square  (btn 2):    Reload
 *   Y / Triangle(btn 3):    Inspect weapon
 *   LB / L1     (btn 4):    Buy menu
 *   RB / R1     (btn 5):    Secondary fire
 *   LT / L2     (btn 6):    (reserved)
 *   RT / R2     (btn 7):    Primary fire
 *   Select      (btn 8):    Scoreboard
 *   Start       (btn 9):    Pause
 *   D-Pad Up    (btn 12):   Weapon slot 1
 *   D-Pad Down  (btn 13):   Weapon slot 2
 *   D-Pad Left  (btn 14):   Weapon slot 3
 *   D-Pad Right (btn 15):   Weapon slot 4
 */
class GamepadManager {
    constructor() {
        this.deadzone = 0.15;
        this.lookSpeed = 600;
        this.connected = false;
        this.prevButtons = new Array(17).fill(false);

        window.addEventListener('gamepadconnected', () => {
            this.connected = true;
        });
        window.addEventListener('gamepaddisconnected', () => {
            this.connected = false;
            input.gamepadActive = false;
            input.gamepadMove.x = 0;
            input.gamepadMove.z = 0;
        });
    }

    applyDeadzone(value) {
        if (Math.abs(value) < this.deadzone) return 0;
        const sign = Math.sign(value);
        return sign * (Math.abs(value) - this.deadzone) / (1 - this.deadzone);
    }

    update(delta) {
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        let gp = null;
        for (const pad of gamepads) {
            if (pad && pad.connected) { gp = pad; break; }
        }

        if (!gp) {
            if (input.gamepadActive) {
                input.gamepadActive = false;
                input.gamepadMove.x = 0;
                input.gamepadMove.z = 0;
            }
            return;
        }

        input.gamepadActive = true;

        // Left stick → movement
        input.gamepadMove.x = this.applyDeadzone(gp.axes[0] || 0);
        input.gamepadMove.z = this.applyDeadzone(gp.axes[1] || 0);

        // Right stick → look (accumulated delta like mouse)
        const rx = this.applyDeadzone(gp.axes[2] || 0);
        const ry = this.applyDeadzone(gp.axes[3] || 0);
        input.gamepadLook.x += rx * this.lookSpeed * delta;
        input.gamepadLook.y += ry * this.lookSpeed * delta;

        // Button helpers
        const buttons = gp.buttons;
        const pressed = (idx) => idx < buttons.length && buttons[idx] && buttons[idx].pressed;
        const justPressed = (idx) => pressed(idx) && !this.prevButtons[idx];
        const justReleased = (idx) => !pressed(idx) && this.prevButtons[idx];

        if (justPressed(0)) window.dispatchEvent(new CustomEvent('onJump'));
        if (justPressed(1)) window.dispatchEvent(new CustomEvent('onCrouch'));
        if (justPressed(2)) window.dispatchEvent(new CustomEvent('onReload'));
        if (justPressed(3)) window.dispatchEvent(new CustomEvent('onInspectWeapon'));
        if (justPressed(4)) window.dispatchEvent(new CustomEvent('onBuyMenu'));
        if (justPressed(5)) window.dispatchEvent(new CustomEvent('onShootSecondary'));
        if (justPressed(7)) window.dispatchEvent(new CustomEvent('onShootPrimary'));
        if (justPressed(8)) window.dispatchEvent(new CustomEvent('onScoreboardShow'));
        if (justReleased(8)) window.dispatchEvent(new CustomEvent('onScoreboardHide'));
        if (justPressed(9)) {
            if (gameState.currentState === STATES.PLAYING) {
                gameState.transition(STATES.PAUSED);
            } else if (gameState.currentState === STATES.PAUSED) {
                gameState.transition(STATES.PLAYING);
            }
        }
        if (justPressed(12)) window.dispatchEvent(new CustomEvent('onWeaponSwitch', { detail: 1 }));
        if (justPressed(13)) window.dispatchEvent(new CustomEvent('onWeaponSwitch', { detail: 2 }));
        if (justPressed(14)) window.dispatchEvent(new CustomEvent('onWeaponSwitch', { detail: 3 }));
        if (justPressed(15)) window.dispatchEvent(new CustomEvent('onWeaponSwitch', { detail: 4 }));

        input.gamepadCrouchHeld = pressed(1);

        for (let i = 0; i < 17 && i < buttons.length; i++) {
            this.prevButtons[i] = pressed(i);
        }
    }
}

const gamepadManager = new GamepadManager();
export default gamepadManager;
