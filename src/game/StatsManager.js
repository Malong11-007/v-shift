class StatsManager {
    constructor() {
        this.reset();
        this.bindEvents();
    }

    reset() {
        this.kills = 0;
        this.headshotKills = 0;
        this.knifeKills = 0;
        this.maxBhopChain = 0;
        this.shotsFired = 0;
        this.shotsHit = 0;

        // Per-player scoreboard tracking: { id: { kills, deaths, team } }
        this.playerStats = {};
    }

    ensurePlayer(id, team) {
        if (!this.playerStats[id]) {
            this.playerStats[id] = { kills: 0, deaths: 0, team: team || 'UNKNOWN' };
        }
    }

    getScoreboard() {
        return { ...this.playerStats };
    }

    bindEvents() {
        window.addEventListener('playerKilled', (e) => {
            const data = e.detail;

            // Track victim death
            if (data.victimId) {
                this.ensurePlayer(data.victimId, data.victimTeam);
                this.playerStats[data.victimId].deaths++;
            }

            if (data.killerIsLocal) {
                this.kills++;
                if (data.isHeadshot) this.headshotKills++;
                if (data.weaponId === 'KNIFE') this.knifeKills++;

                // Track local player kills in scoreboard
                const localId = (window.localPlayer && window.localPlayer.id) || 'YOU';
                this.ensurePlayer(localId, 'ATTACKERS');
                this.playerStats[localId].kills++;
            }
        });

        window.addEventListener('onBhop', (e) => {
            this.maxBhopChain = Math.max(this.maxBhopChain, e.detail);
        });

        window.addEventListener('weaponFired', () => {
            this.shotsFired++;
        });

        window.addEventListener('hitMarker', (e) => {
            if (e.detail && e.detail.type !== 'wall') {
                this.shotsHit++;
            }
        });
    }

    initPlayers(bots, localPlayerId) {
        // Register all players for scoreboard at match start
        this.ensurePlayer(localPlayerId, 'ATTACKERS');
        for (const bot of bots) {
            this.ensurePlayer(bot.id, bot.team);
        }
    }

    calculateAwards() {
        const awards = [];
        
        // MVP (Just MVP if they got kills, since solo mode right now)
        if (this.kills >= 5) {
            awards.push({ title: 'MVP', desc: 'Most Volatile Projectile', icon: '⭐' });
        }
        
        // Sharpshooter
        const hsPct = this.kills > 0 ? (this.headshotKills / this.kills) : 0;
        if (hsPct >= 0.4 && this.kills > 2) {
            awards.push({ title: 'Sharpshooter', desc: `${Math.round(hsPct * 100)}% Headshot Accuracy`, icon: '🎯' });
        }
        
        // Speed Demon
        if (this.maxBhopChain >= 5) {
            awards.push({ title: 'Speed Demon', desc: `Max B-Hop Chain: ${this.maxBhopChain}`, icon: '⚡' });
        }
        
        // Humiliator
        if (this.knifeKills >= 1) {
            awards.push({ title: 'Humiliator', desc: `${this.knifeKills} Melee Kills`, icon: '🔪' });
        }

        // Trigger Happy
        if (this.shotsFired > 100 && (this.shotsHit / this.shotsFired) < 0.2) {
            awards.push({ title: 'Trigger Happy', desc: 'Accuracy < 20%', icon: '💥' });
        }

        return awards;
    }
}

const statsManager = new StatsManager();
export default statsManager;
