import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CompetitiveFlow, TEAMS, ROUND_RESULT } from './CompetitiveFlow.js';
import roundManager, { ROUND_STATES } from './RoundManager.js';
import economyManager from './EconomyManager.js';
import statsManager from './StatsManager.js';

/**
 * Integration tests that validate full game flow scenarios end-to-end:
 * - Multi-round competitive matches with score tracking
 * - Kill event propagation and team elimination
 * - Scoreboard stat tracking across rounds
 * - Round transitions triggered by timer expiration
 */
describe('Gameplay Integration', () => {
    let flow;

    beforeEach(() => {
        roundManager.state = ROUND_STATES.FREEZE_TIME;
        roundManager.timer = roundManager.durations.FREEZE_TIME;
        roundManager.currentRound = 1;
        roundManager.scores = { ATTACKERS: 0, DEFENDERS: 0 };
        economyManager.reset();
        statsManager.reset();
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

    describe('Round flow end-to-end', () => {
        it('full round cycle: freeze → live → post_round → next round', () => {
            flow.activate();

            // Should start in freeze time
            expect(roundManager.state).toBe(ROUND_STATES.FREEZE_TIME);
            expect(roundManager.currentRound).toBe(1);

            // Transition to live
            roundManager.transition(ROUND_STATES.LIVE);
            expect(roundManager.state).toBe(ROUND_STATES.LIVE);

            // Team elimination ends the round
            window.dispatchEvent(new CustomEvent('playerKilled', { detail: { victimTeam: TEAMS.ATTACKERS } }));
            window.dispatchEvent(new CustomEvent('playerKilled', { detail: { victimTeam: TEAMS.ATTACKERS } }));

            // Should be post-round now
            expect(roundManager.state).toBe(ROUND_STATES.POST_ROUND);
            expect(roundManager.scores.DEFENDERS).toBe(1);

            // Timer expires → next round
            roundManager.timer = 0.1;
            roundManager.update(0.2);
            expect(roundManager.currentRound).toBe(2);
            expect(roundManager.state).toBe(ROUND_STATES.FREEZE_TIME);
        });

        it('defenders win when time expires during live round', () => {
            flow.activate();
            roundManager.transition(ROUND_STATES.LIVE);
            const endSpy = vi.spyOn(roundManager, 'endRound');

            // Simulate time running out
            roundManager.timer = 0.1;
            roundManager.update(0.2);

            expect(endSpy).toHaveBeenCalledWith('DEFENDERS', 'TIME_EXPIRED');
            expect(roundManager.scores.DEFENDERS).toBe(1);
        });

        it('tracks score across multiple rounds', () => {
            flow.configureTeams({ attackers: 1, defenders: 1 });
            flow.activate();

            // Round 1: Attackers win
            roundManager.transition(ROUND_STATES.LIVE);
            window.dispatchEvent(new CustomEvent('playerKilled', { detail: { victimTeam: TEAMS.DEFENDERS } }));
            expect(roundManager.scores.ATTACKERS).toBe(1);

            // Transition to next round
            roundManager.timer = 0.1;
            roundManager.update(0.2);

            // Round 2: Defenders win
            roundManager.transition(ROUND_STATES.LIVE);
            window.dispatchEvent(new CustomEvent('playerKilled', { detail: { victimTeam: TEAMS.ATTACKERS } }));
            expect(roundManager.scores.DEFENDERS).toBe(1);
            expect(roundManager.scores.ATTACKERS).toBe(1);
        });
    });

    describe('Kill event propagation with victimTeam', () => {
        it('playerKilled event with victimTeam triggers team elimination check', () => {
            flow.configureTeams({ attackers: 2, defenders: 1 });
            flow.activate();
            roundManager.transition(ROUND_STATES.LIVE);

            const endSpy = vi.spyOn(roundManager, 'endRound');

            // Kill the only defender
            window.dispatchEvent(new CustomEvent('playerKilled', {
                detail: { victimTeam: TEAMS.DEFENDERS, victimId: 'bot_def_1', weaponId: 'V44SABRE' }
            }));

            expect(endSpy).toHaveBeenCalledWith(TEAMS.ATTACKERS, ROUND_RESULT.DEFENDERS_ELIMINATED);
        });

        it('playerKilled event without victimTeam does not crash or end round', () => {
            flow.configureTeams({ attackers: 2, defenders: 2 });
            flow.activate();
            roundManager.transition(ROUND_STATES.LIVE);

            const endSpy = vi.spyOn(roundManager, 'endRound');

            // Event missing victimTeam — should be silently ignored
            window.dispatchEvent(new CustomEvent('playerKilled', {
                detail: { victimId: 'bot_1', weaponId: 'V44SABRE' }
            }));

            expect(endSpy).not.toHaveBeenCalled();
        });
    });

    describe('Scoreboard stat tracking', () => {
        it('initPlayers registers all players for scoreboard', () => {
            const mockBots = [
                { id: 'bot_def_1', team: 'DEFENDERS' },
                { id: 'bot_def_2', team: 'DEFENDERS' },
                { id: 'bot_atk_1', team: 'ATTACKERS' }
            ];
            statsManager.initPlayers(mockBots, 'player_1');

            const scoreboard = statsManager.getScoreboard();
            expect(scoreboard['player_1']).toBeDefined();
            expect(scoreboard['player_1'].team).toBe('ATTACKERS');
            expect(scoreboard['bot_def_1']).toBeDefined();
            expect(scoreboard['bot_def_1'].team).toBe('DEFENDERS');
        });

        it('tracks kills and deaths per player across events', () => {
            statsManager.initPlayers(
                [{ id: 'bot_def_1', team: 'DEFENDERS' }],
                'player_1'
            );

            // Set up window.localPlayer so StatsManager uses correct ID
            window.localPlayer = { id: 'player_1' };

            // Player kills bot
            window.dispatchEvent(new CustomEvent('playerKilled', {
                detail: {
                    killerIsLocal: true,
                    victimId: 'bot_def_1',
                    victimTeam: 'DEFENDERS',
                    weaponId: 'V44SABRE',
                    isHeadshot: false
                }
            }));

            const scoreboard = statsManager.getScoreboard();
            expect(scoreboard['player_1'].kills).toBe(1);
            expect(scoreboard['bot_def_1'].deaths).toBe(1);

            // Cleanup
            delete window.localPlayer;
        });

        it('tracks deaths for previously unregistered players', () => {
            // Bot dies without being pre-registered
            window.dispatchEvent(new CustomEvent('playerKilled', {
                detail: {
                    killerIsLocal: false,
                    victimId: 'bot_unknown',
                    victimTeam: 'ATTACKERS',
                    weaponId: 'V44SABRE'
                }
            }));

            const scoreboard = statsManager.getScoreboard();
            expect(scoreboard['bot_unknown']).toBeDefined();
            expect(scoreboard['bot_unknown'].deaths).toBe(1);
        });
    });

    describe('Spike round-ending scenarios', () => {
        it('attackers win via spike detonation within extended timer', () => {
            flow.activate();
            roundManager.transition(ROUND_STATES.LIVE);
            roundManager.timer = 5; // Only 5s left

            const endSpy = vi.spyOn(roundManager, 'endRound');

            // Plant spike with 3s fuse
            flow.onSpikePlanted({ detail: { fuseTime: 3 } });
            expect(flow.spikeTimer).toBe(3);

            // Timer extended
            expect(roundManager.timer).toBeGreaterThanOrEqual(3);

            // Tick past fuse
            flow.update(3.1);
            expect(endSpy).toHaveBeenCalledWith(TEAMS.ATTACKERS, ROUND_RESULT.SPIKE_DETONATED);
        });

        it('spike timer only ticks during live state', () => {
            flow.activate();
            roundManager.transition(ROUND_STATES.LIVE);
            flow.onSpikePlanted({ detail: { fuseTime: 10 } });

            // Tick 2 seconds
            flow.update(2);
            expect(flow.spikeTimer).toBeCloseTo(8);

            // Move to post-round (spike timer should stop)
            roundManager.state = ROUND_STATES.POST_ROUND;
            flow.update(5);
            expect(flow.spikeTimer).toBeCloseTo(8); // Didn't change
        });
    });
});
