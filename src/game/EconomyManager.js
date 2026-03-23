class EconomyManager {
    constructor() {
        this.cash = 800;
        this.maxCash = 9000;
        this.buyWindowOpen = false;
        this.buyWindowRemaining = 0;
        
        // Loss streak dictates round loss bonus
        this.lossStreak = 0;
        
        // Bind to events
        window.addEventListener('playerKilled', this.handleKill.bind(this));
        window.addEventListener('roundEnded', this.handleRoundEnd.bind(this));
    }

    addCash(amount, reason = '') {
        const oldCash = this.cash;
        this.cash = Math.min(this.cash + amount, this.maxCash);
        
        if (this.cash !== oldCash) {
            console.log(`[Economy] +$${amount} (${reason}). Total: $${this.cash}`);
            window.dispatchEvent(new CustomEvent('cashChanged', { detail: { cash: this.cash, delta: amount, reason } }));
        }
    }

    spendCash(amount) {
        if (this.cash >= amount) {
            this.cash -= amount;
            window.dispatchEvent(new CustomEvent('cashChanged', { detail: { cash: this.cash, delta: -amount, reason: 'Purchase' } }));
            return true;
        }
        return false;
    }

    openBuyPhase(durationSeconds = 0) {
        this.buyWindowOpen = true;
        this.buyWindowRemaining = durationSeconds;
        window.dispatchEvent(new CustomEvent('buyPhaseChanged', { detail: { open: true, duration: durationSeconds } }));
    }

    closeBuyPhase() {
        if (!this.buyWindowOpen) return;
        this.buyWindowOpen = false;
        this.buyWindowRemaining = 0;
        window.dispatchEvent(new CustomEvent('buyPhaseChanged', { detail: { open: false } }));
    }

    purchase(cost) {
        if (!this.buyWindowOpen) {
            return { success: false, reason: 'BUY_CLOSED', cash: this.cash };
        }
        const success = this.spendCash(cost);
        return {
            success,
            reason: success ? 'OK' : 'INSUFFICIENT_FUNDS',
            cash: this.cash
        };
    }

    handleKill(e) {
        // e.detail: { weaponId, isHeadshot, isFirstBlood }
        const data = e.detail;
        
        // In reality, read from WeaponData module
        // We'll dispatch a generic 300 for now if unknown 
        let reward = data.reward || 300; 
        
        this.addCash(reward, 'Enemy Killed');
        
        if (data.isFirstBlood) {
            this.addCash(200, 'First Blood');
        }
        if (data.isHeadshot) {
            this.addCash(100, 'Headshot Bonus');
        }
    }

    handleRoundEnd(e) {
        // Did our team win? (Assumes local player is always on the evaluated team for now)
        const won = e.detail.winner === 'ATTACKERS'; // Simplified, need team tracking
        
        if (won) {
            this.lossStreak = 0;
            this.addCash(3000, 'Round Win'); // $3000 win
        } else {
            // Escalating loss bonus: 1400 -> 1900 -> 2400 -> 2900 max
            this.lossStreak++;
            const lossBonus = 1400 + Math.min((this.lossStreak - 1) * 500, 1500);
            this.addCash(lossBonus, 'Round Loss Bonus');
        }
    }

    reset() {
        this.cash = 800;
        this.lossStreak = 0;
        this.buyWindowOpen = false;
        this.buyWindowRemaining = 0;
        window.dispatchEvent(new CustomEvent('cashChanged', { detail: { cash: this.cash, delta: 0, reason: 'Match Start' } }));
    }
}

const economyManager = new EconomyManager();
export default economyManager;
