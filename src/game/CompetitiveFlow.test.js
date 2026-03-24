import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CompetitiveFlow, TEAMS, ROUND_RESULT } from './CompetitiveFlow.js';
import roundManager, { ROUND_STATES } from './RoundManager.js';
import economyManager from './EconomyManager.js';

describe('CompetitiveFlow', () => {
    let flow;

    beforeEach(() => {
        // Reset shared singletons
        roundManager.state = ROUND_STATES.FREEZE_TIME;
        roundManager.timer = roundManager.durations.FREEZE_TIME;
        roundManager.currentRound = 1;
        economyManager.reset();
        vi.restoreAllMocks();

        flow = new CompetitiveFlow({
            round: roundManager,
            economy: economyManager,
            spikeFuseTime: 3,
            defaultTeamSize: { attackers: 2, defenders: 2 }
        });
    });

    afterEach(() => {
        flow.deactivate();
    });

    it('opens buy during freeze and blocks purchases after LIVE begins', () => {
        flow.activate();

        expect(economyManager.buyWindowOpen).toBe(true);
        const buyResult = economyManager.purchase(200);
        expect(buyResult.success).toBe(true);

        roundManager.transition(ROUND_STATES.LIVE);
        expect(economyManager.buyWindowOpen).toBe(false);

        const denied = economyManager.purchase(200);
        expect(denied.success).toBe(false);

        roundManager.transition(ROUND_STATES.POST_ROUND);
        expect(economyManager.buyWindowOpen).toBe(false);
    });

    it('ends round when attackers are wiped before spike plant', () => {
        flow.configureTeams({ attackers: 1, defenders: 2 });
        flow.activate();
        roundManager.transition(ROUND_STATES.LIVE);
        const endSpy = vi.spyOn(roundManager, 'endRound');

        window.dispatchEvent(new CustomEvent('playerKilled', { detail: { victimTeam: TEAMS.ATTACKERS } }));

        expect(endSpy).toHaveBeenCalledWith(TEAMS.DEFENDERS, ROUND_RESULT.ATTACKERS_ELIMINATED);
        expect(roundManager.state).toBe(ROUND_STATES.POST_ROUND);
    });

    it('lets spike detonate when not defused in time', () => {
        flow.activate();
        roundManager.transition(ROUND_STATES.LIVE);
        const endSpy = vi.spyOn(roundManager, 'endRound');

        flow.onSpikePlanted({ detail: { fuseTime: 2 } });
        flow.update(1.5);
        flow.update(0.6); // Exceed fuse time

        expect(endSpy).toHaveBeenCalledWith(TEAMS.ATTACKERS, ROUND_RESULT.SPIKE_DETONATED);
        expect(roundManager.state).toBe(ROUND_STATES.POST_ROUND);
    });

    it('rewards defenders for a successful defuse', () => {
        flow.activate();
        roundManager.transition(ROUND_STATES.LIVE);
        const endSpy = vi.spyOn(roundManager, 'endRound');

        flow.onSpikePlanted({ detail: { fuseTime: 5 } });
        flow.onSpikeDefused();

        expect(endSpy).toHaveBeenCalledWith(TEAMS.DEFENDERS, ROUND_RESULT.SPIKE_DEFUSED);
        expect(roundManager.state).toBe(ROUND_STATES.POST_ROUND);
    });

    it('ends round when all defenders are eliminated even with spike planted (no softlock)', () => {
        flow.configureTeams({ attackers: 2, defenders: 1 });
        flow.activate();
        roundManager.transition(ROUND_STATES.LIVE);
        const endSpy = vi.spyOn(roundManager, 'endRound');

        // Plant spike first
        flow.onSpikePlanted({ detail: { fuseTime: 40 } });
        expect(flow.spikeTimer).toBe(40);

        // Kill last defender — should end round immediately for attackers
        window.dispatchEvent(new CustomEvent('playerKilled', { detail: { victimTeam: TEAMS.DEFENDERS } }));

        expect(endSpy).toHaveBeenCalledWith(TEAMS.ATTACKERS, ROUND_RESULT.DEFENDERS_ELIMINATED);
        expect(roundManager.state).toBe(ROUND_STATES.POST_ROUND);
    });

    it('does not end round when inactive', () => {
        // Do NOT activate flow
        roundManager.transition(ROUND_STATES.LIVE);
        const endSpy = vi.spyOn(roundManager, 'endRound');

        flow.onPlayerKilled({ detail: { victimTeam: TEAMS.ATTACKERS } });

        expect(endSpy).not.toHaveBeenCalled();
    });

    it('resets alive counts on new freeze time', () => {
        flow.configureTeams({ attackers: 3, defenders: 3 });
        flow.activate();
        roundManager.transition(ROUND_STATES.LIVE);

        // Kill some players
        flow.onPlayerKilled({ detail: { victimTeam: TEAMS.ATTACKERS } });
        expect(flow.alive[TEAMS.ATTACKERS]).toBe(2);

        // New round starts
        roundManager.transition(ROUND_STATES.FREEZE_TIME);
        expect(flow.alive[TEAMS.ATTACKERS]).toBe(3);
        expect(flow.alive[TEAMS.DEFENDERS]).toBe(3);
    });

    it('ignores spike defuse/detonate when no spike is planted', () => {
        flow.activate();
        roundManager.transition(ROUND_STATES.LIVE);
        const endSpy = vi.spyOn(roundManager, 'endRound');

        flow.onSpikeDefused();
        expect(endSpy).not.toHaveBeenCalled();

        flow.onSpikeDetonated();
        expect(endSpy).not.toHaveBeenCalled();
    });

    it('spike timer extends round timer when planted', () => {
        flow.activate();
        roundManager.transition(ROUND_STATES.LIVE);
        roundManager.timer = 10; // Only 10 seconds left

        flow.onSpikePlanted({ detail: { fuseTime: 40 } });

        // Round timer should be extended to at least the fuse time
        expect(roundManager.timer).toBeGreaterThanOrEqual(40);
    });
});
