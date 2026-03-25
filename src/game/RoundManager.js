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
        
        // Team Score Tracking
        this.scores = {
            ATTACKERS: 0,
            DEFENDERS: 0
        };
        this.winsNeeded = Math.ceil(this.maxRounds / 2);
    }

    startMatch() {
        this.currentRound = 1;
        this.overtime = false;
        this.resetScores();
        this.startRound();
    }

    resetScores() {
        this.scores = { ATTACKERS: 0, DEFENDERS: 0 };
        this.winsNeeded = Math.ceil(this.maxRounds / 2);
        window.dispatchEvent(new CustomEvent('scoresUpdated', { detail: { scores: { ...this.scores } } }));
    }

    startRound() {
        this.transition(ROUND_STATES.FREEZE_TIME);
        window.dispatchEvent(new CustomEvent('roundStarted', { detail: { round: this.currentRound } }));
    }

    endRound(winningTeam, reason) {
        if (this.state === ROUND_STATES.POST_ROUND) return;
        
        // Track score
        if (winningTeam && this.scores[winningTeam] !== undefined) {
            this.scores[winningTeam]++;
        }
        
        console.log(`Round ${this.currentRound} Over. Winner: ${winningTeam} (${reason}) | Score: ATK ${this.scores.ATTACKERS} - DEF ${this.scores.DEFENDERS}`);
        window.dispatchEvent(new CustomEvent('roundEnded', { detail: { winner: winningTeam, reason, scores: { ...this.scores } } }));
        window.dispatchEvent(new CustomEvent('scoresUpdated', { detail: { scores: { ...this.scores } } }));
        
        // Check for match win (first to winsNeeded)
        if (this.scores[winningTeam] >= this.winsNeeded) {
            this.transition(ROUND_STATES.POST_ROUND);
            console.log(`[RoundManager] Match won by ${winningTeam}!`);
            window.dispatchEvent(new CustomEvent('matchEnded', {
                detail: { finalRound: this.currentRound, winner: winningTeam, scores: { ...this.scores } }
            }));
            return;
        }
        
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
                    if (this.currentRound > this.maxRounds) {
                        // Match over
                        console.log('[RoundManager] Match complete.');
                        window.dispatchEvent(new CustomEvent('matchEnded', { detail: { finalRound: this.currentRound - 1 } }));
                        return;
                    }
                    this.startRound();
                }
            }
        }
    }
}

const roundManager = new RoundManager();
export default roundManager;
