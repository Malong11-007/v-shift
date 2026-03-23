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
    }

    bindEvents() {
        window.addEventListener('playerKilled', (e) => {
            const data = e.detail;
            if (data.killerIsLocal) {
                this.kills++;
                if (data.isHeadshot) this.headshotKills++;
                if (data.weaponId === 'KNIFE') this.knifeKills++;
            }
        });

        window.addEventListener('onBhop', (e) => {
            this.maxBhopChain = Math.max(this.maxBhopChain, e.detail);
        });

        window.addEventListener('weaponFired', () => {
            this.shotsFired++;
        });

        window.addEventListener('hitMarker', () => {
            this.shotsHit++;
        });
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
