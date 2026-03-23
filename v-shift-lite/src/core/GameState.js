export const STATES = {
    LOADING: 'LOADING',
    NAME_SELECT: 'NAME_SELECT',
    MAIN_MENU: 'MAIN_MENU',
    MODE_SELECT: 'MODE_SELECT',
    CLASS_SELECT: 'CLASS_SELECT',
    LOBBY: 'LOBBY',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    SETTINGS: 'SETTINGS',
    SCOREBOARD: 'SCOREBOARD'
};

class GameState {
    constructor() {
        this.currentState = null;
        this.previousState = null;
    }

    /**
     * Transition to a new game state.
     * Fires a window event so UI layers can react.
     * @param {string} newState - Must be one of the STATES exported constants
     * @param {object} payload - Optional data to pass to the new state
     */
    transition(newState, payload = {}) {
        if (!Object.values(STATES).includes(newState)) {
            console.error(`Invalid state transition attempted: ${newState}`);
            return;
        }

        if (this.currentState === newState) {
            return; // Already in this state
        }

        this.previousState = this.currentState;
        this.currentState = newState;

        console.log(`[GameState] Transition: ${this.previousState} -> ${this.currentState}`, payload);

        // Fire a robust DOM event for UI Reactivity
        const event = new CustomEvent('gameStateChange', {
            detail: {
                previous: this.previousState,
                current: this.currentState,
                payload: payload
            }
        });
        window.dispatchEvent(event);
    }
}

const gameState = new GameState();
export default gameState;
