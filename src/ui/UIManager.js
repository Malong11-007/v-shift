import gameState, { STATES } from '../core/GameState.js';
import LoadingScreen from './LoadingScreen.js';
import NameSelect from './NameSelect.js';
import MainMenu from './MainMenu.js';
import ModeSelect from './ModeSelect.js';
import ClassSelect from './ClassSelect.js';
import Settings from './Settings.js';
import Scoreboard from './Scoreboard.js';
import Lobby from './Lobby.js';
import Leaderboard from './Leaderboard.js';
import PauseMenu from './PauseMenu.js';

class UIManager {
    constructor() {
        this.root = document.getElementById('ui-root');
        if (!this.root) {
            console.error('[UIManager] Could not find #ui-root in DOM');
            return;
        }

        // Initialize all screens
        this.screens = {
            [STATES.LOADING]: new LoadingScreen(),
            [STATES.NAME_SELECT]: new NameSelect(),
            [STATES.MAIN_MENU]: new MainMenu(),
            [STATES.MODE_SELECT]: new ModeSelect(),
            [STATES.CLASS_SELECT]: new ClassSelect(),
            [STATES.SETTINGS]: new Settings(),
            [STATES.SCOREBOARD]: new Scoreboard(),
            [STATES.LOBBY]: new Lobby(),
            [STATES.LEADERBOARD]: new Leaderboard(),
            [STATES.PAUSED]: new PauseMenu(),
            // HUD and BuyMenu are persistent/special overlays handled separately or here later
        };

        // Mount all screens to DOM but hide them
        for (const [state, screen] of Object.entries(this.screens)) {
            if (screen.container) {
                screen.container.style.display = 'none';
                this.root.appendChild(screen.container);
            }
        }

        this.activeScreen = null;

        // Listen for global state changes
        window.addEventListener('gameStateChange', this.handleStateChange.bind(this));
    }

    handleStateChange(e) {
        const { current, payload } = e.detail;
        
        // Hide current screen
        if (this.activeScreen && this.activeScreen.container) {
            this.activeScreen.hide();
        }

        // Show new screen
        if (this.screens[current]) {
            this.activeScreen = this.screens[current];
            this.activeScreen.show(payload);
        } else {
            this.activeScreen = null;
        }
    }
}

export default new UIManager();
