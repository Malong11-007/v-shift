import roundManager, { ROUND_STATES } from './RoundManager.js';
import economyManager from './EconomyManager.js';
import competitiveFlow from './CompetitiveFlow.js';

export const GAME_MODES = {
    COMPETITIVE: 'COMPETITIVE',
    DEATHMATCH: 'DEATHMATCH',
    GUN_GAME: 'GUN_GAME'
};

class MatchManager {
    constructor() {
        this.currentMode = GAME_MODES.COMPETITIVE;
        
        // Listen to game events
        window.addEventListener('playerKilled', this.handleKill.bind(this));
    }

    setMode(mode) {
        this.currentMode = mode;
        console.log(`[MatchManager] Mode set to ${mode}`);
        
        if (mode === GAME_MODES.COMPETITIVE) {
            competitiveFlow.activate();
        } else if (mode === GAME_MODES.DEATHMATCH) {
             competitiveFlow.deactivate();
             // Deathmatch: continuous 10 min, instant respawns, infinite money
             economyManager.cash = 99999;
             // We can use roundManager as a simple 10-min timer by hijacking FREEZE_TIME
             roundManager.durations.LIVE = 600; 
             roundManager.transition(ROUND_STATES.LIVE);
        } else if (mode === GAME_MODES.GUN_GAME) {
             competitiveFlow.deactivate();
             // Gun game logic
             roundManager.durations.LIVE = 1800; // 30 min cap
             roundManager.transition(ROUND_STATES.LIVE);
        }
    }

    handleKill(e) {
        if (this.currentMode === GAME_MODES.GUN_GAME) {
            // Gun game weapon upgrade/downgrade logic would go here
            console.log('[MatchManager] Gun Game Kill detected');
        }
    }
}

const matchManager = new MatchManager();
export default matchManager;
