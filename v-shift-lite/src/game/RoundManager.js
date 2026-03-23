export const ROUND_STATES = {
    FREEZE_TIME: 'FREEZE_TIME', // Buying phase
    LIVE: 'LIVE',               // Active gameplay
    POST_ROUND: 'POST_ROUND'    // Round ended, showing winners
};

class RoundManager {
    constructor() {
        this.state = ROUND_STATES.FREEZE_TIME;
        this.timer = 0;
        
        // Settings
        this.durations = {
            FREEZE_TIME: 10,
            LIVE: 90,
            POST_ROUND: 5
        };
        
        // Match Tracking
        this.currentRound = 1;
        this.maxRounds = 13; // First to 7
        this.overtime = false;
        
        // Add tick method to engine if needed, but usually we just update this via a Game Loop
    }

    startMatch() {
        this.currentRound = 1;
        this.overtime = false;
        this.startRound();
    }

    startRound() {
        this.transition(ROUND_STATES.FREEZE_TIME);
        window.dispatchEvent(new CustomEvent('roundStarted', { detail: { round: this.currentRound } }));
    }

    endRound(winningTeam, reason) {
        if (this.state === ROUND_STATES.POST_ROUND) return;
        
        console.log(`Round ${this.currentRound} Over. Winner: ${winningTeam} (${reason})`);
        window.dispatchEvent(new CustomEvent('roundEnded', { detail: { winner: winningTeam, reason } }));
        
        this.transition(ROUND_STATES.POST_ROUND);
    }

    transition(newState) {
        this.state = newState;
        this.timer = this.durations[newState];
        
        console.log(`[RoundManager] Transition to ${newState}`);
        window.dispatchEvent(new CustomEvent('roundStateChanged', { detail: { state: this.state, timer: this.timer } }));
    }

    update(delta) {
        if (this.timer > 0) {
            this.timer -= delta;
            
            // Check for state expiration
            if (this.timer <= 0) {
                if (this.state === ROUND_STATES.FREEZE_TIME) {
                    this.transition(ROUND_STATES.LIVE);
                } else if (this.state === ROUND_STATES.LIVE) {
                    // Time ran out! Defenders win.
                    this.endRound('DEFENDERS', 'TIME_EXPIRED');
                } else if (this.state === ROUND_STATES.POST_ROUND) {
                    // Start next round
                    this.currentRound++;
                    // Check half time or match end logic here...
                    this.startRound();
                }
            }
        }
    }
}

const roundManager = new RoundManager();
export default roundManager;
