import roundManager, { ROUND_STATES } from './RoundManager.js';
import economyManager from './EconomyManager.js';

export const TEAMS = {
    ATTACKERS: 'ATTACKERS',
    DEFENDERS: 'DEFENDERS'
};

export const ROUND_RESULT = {
    ATTACKERS_ELIMINATED: 'ATTACKERS_ELIMINATED',
    DEFENDERS_ELIMINATED: 'DEFENDERS_ELIMINATED',
    SPIKE_DETONATED: 'SPIKE_DETONATED',
    SPIKE_DEFUSED: 'SPIKE_DEFUSED',
    TIME_EXPIRED: 'TIME_EXPIRED'
};

/**
 * CompetitiveFlow orchestrates a Valorant-style round:
 * 1) Freeze/buy time
 * 2) Live phase
 * 3) Spike plant/defuse
 * 4) Post round reset
 * It is intentionally event-driven so gameplay and tests can drive full round scenarios.
 */
export class CompetitiveFlow {
    constructor({
        round = roundManager,
        economy = economyManager,
        spikeFuseTime = 40,
        defaultTeamSize = { attackers: 5, defenders: 5 }
    } = {}) {
        this.round = round;
        this.economy = economy;
        this.spikeFuseTime = spikeFuseTime;
        this.teamSize = {
            [TEAMS.ATTACKERS]: defaultTeamSize.attackers,
            [TEAMS.DEFENDERS]: defaultTeamSize.defenders
        };
        this.resetRoundState();
        this.active = false;
        this.attached = false;

        this.handlers = {
            onRoundStateChanged: this.onRoundStateChanged.bind(this),
            onPlayerKilled: this.onPlayerKilled.bind(this),
            onSpikePlanted: this.onSpikePlanted.bind(this),
            onSpikeDefused: this.onSpikeDefused.bind(this),
            onSpikeDetonated: this.onSpikeDetonated.bind(this)
        };
    }

    resetRoundState() {
        this.alive = {
            [TEAMS.ATTACKERS]: this.teamSize[TEAMS.ATTACKERS],
            [TEAMS.DEFENDERS]: this.teamSize[TEAMS.DEFENDERS]
        };
        this.spikeTimer = null;
    }

    configureTeams({ attackers, defenders }) {
        if (typeof attackers === 'number') this.teamSize[TEAMS.ATTACKERS] = attackers;
        if (typeof defenders === 'number') this.teamSize[TEAMS.DEFENDERS] = defenders;
        this.resetRoundState();
    }

    activate() {
        if (this.active) return;
        this.active = true;
        this.attachListeners();
        // Begin a fresh match flow
        this.economy.reset();
        this.round.startMatch();
    }

    deactivate() {
        if (!this.active) return;
        this.active = false;
        this.detachListeners();
        this.economy.closeBuyPhase();
        this.spikeTimer = null;
    }

    attachListeners() {
        if (this.attached) return;
        window.addEventListener('roundStateChanged', this.handlers.onRoundStateChanged);
        window.addEventListener('roundStarted', this.handlers.onRoundStateChanged);
        window.addEventListener('playerKilled', this.handlers.onPlayerKilled);
        window.addEventListener('spikePlanted', this.handlers.onSpikePlanted);
        window.addEventListener('spikeDefused', this.handlers.onSpikeDefused);
        window.addEventListener('spikeDetonated', this.handlers.onSpikeDetonated);
        this.attached = true;
    }

    detachListeners() {
        if (!this.attached) return;
        window.removeEventListener('roundStateChanged', this.handlers.onRoundStateChanged);
        window.removeEventListener('roundStarted', this.handlers.onRoundStateChanged);
        window.removeEventListener('playerKilled', this.handlers.onPlayerKilled);
        window.removeEventListener('spikePlanted', this.handlers.onSpikePlanted);
        window.removeEventListener('spikeDefused', this.handlers.onSpikeDefused);
        window.removeEventListener('spikeDetonated', this.handlers.onSpikeDetonated);
        this.attached = false;
    }

    onRoundStateChanged(e) {
        const state = e.detail?.state || e.detail?.roundState || this.round.state;

        if (state === ROUND_STATES.FREEZE_TIME) {
            this.economy.openBuyPhase(this.round.durations.FREEZE_TIME);
            this.resetRoundState();
        }

        if (state === ROUND_STATES.LIVE) {
            this.economy.closeBuyPhase();
        }

        if (state === ROUND_STATES.POST_ROUND) {
            this.spikeTimer = null;
        }
    }

    onPlayerKilled(e) {
        if (!this.active) return;
        const victimTeam = e.detail?.victimTeam;
        if (!victimTeam || !this.alive[victimTeam]) return;

        this.alive[victimTeam] = Math.max(0, this.alive[victimTeam] - 1);

        const attackersAlive = this.alive[TEAMS.ATTACKERS];
        const defendersAlive = this.alive[TEAMS.DEFENDERS];

        if (attackersAlive === 0) {
            this.endRound(TEAMS.DEFENDERS, ROUND_RESULT.ATTACKERS_ELIMINATED);
        } else if (defendersAlive === 0 && this.spikeTimer === null) {
            // If spike is planted, defenders could still defuse; when not planted, attackers win instantly.
            this.endRound(TEAMS.ATTACKERS, ROUND_RESULT.DEFENDERS_ELIMINATED);
        }
    }

    onSpikePlanted(e) {
        if (!this.active) return;
        const fuse = e.detail?.fuseTime ?? this.spikeFuseTime;
        this.spikeTimer = fuse;
        // Extend live timer so the spike can tick down
        this.round.timer = Math.max(this.round.timer, fuse);
        this.economy.closeBuyPhase();
    }

    onSpikeDefused() {
        if (!this.active || this.spikeTimer === null) return;
        this.endRound(TEAMS.DEFENDERS, ROUND_RESULT.SPIKE_DEFUSED);
    }

    onSpikeDetonated() {
        if (!this.active || this.spikeTimer === null) return;
        this.endRound(TEAMS.ATTACKERS, ROUND_RESULT.SPIKE_DETONATED);
    }

    endRound(winner, reason) {
        if (this.round.state === ROUND_STATES.POST_ROUND) return;
        this.economy.closeBuyPhase();
        this.round.endRound(winner, reason);
    }

    update(delta) {
        if (!this.active) return;
        // Spike timer ticks only while live
        if (this.round.state === ROUND_STATES.LIVE && this.spikeTimer !== null) {
            this.spikeTimer -= delta;
            if (this.spikeTimer <= 0) {
                this.onSpikeDetonated();
            }
        }
    }
}

const competitiveFlow = new CompetitiveFlow();
export default competitiveFlow;
