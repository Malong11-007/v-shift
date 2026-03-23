class AudioManager {
    constructor() {
        this.context = new (window.AudioContext || window.webkitAudioContext)();
        this.masterVolume = this.context.createGain();
        this.masterVolume.gain.value = 0.5;
        this.masterVolume.connect(this.context.destination);
        
        // Volume categories
        this.volumes = {
            master: 0.5,
            sfx: 0.8,
            music: 0.3
        };
        
        // Load settings from localStorage
        this.loadSettings();
    }

    async init() {
        if (this.context.state === 'suspended') {
            await this.context.resume();
        }
    }

    loadSettings() {
        try {
            const saved = JSON.parse(localStorage.getItem('vshift_audio') || '{}');
            if (saved.master !== undefined) this.volumes.master = saved.master;
            if (saved.sfx !== undefined) this.volumes.sfx = saved.sfx;
            if (saved.music !== undefined) this.volumes.music = saved.music;
            this.masterVolume.gain.value = this.volumes.master;
        } catch(e) {}
    }

    setVolume(category, value) {
        this.volumes[category] = value;
        if (category === 'master') {
            this.masterVolume.gain.value = value;
        }
        localStorage.setItem('vshift_audio', JSON.stringify(this.volumes));
    }

    playSyntheticSfx(type) {
        if (this.context.state === 'suspended') this.context.resume();
        
        const now = this.context.currentTime;
        const vol = this.volumes.sfx;

        switch(type) {
            // ─── Weapon SFX (Phase 11.2) ───
            case 'shoot':
            case 'shoot_rifle':
                this._shootRifle(now, vol);
                break;
            case 'shoot_sniper':
                this._shootSniper(now, vol);
                break;
            case 'shoot_smg':
                this._shootSMG(now, vol);
                break;
            case 'shoot_shotgun':
                this._shootShotgun(now, vol);
                break;
            case 'shoot_pistol':
                this._shootPistol(now, vol);
                break;
            case 'shoot_melee':
                this._shootMelee(now, vol);
                break;
                
            // ─── Movement SFX (Phase 11.3) ───
            case 'jump':
                this._jumpSfx(now, vol);
                break;
            case 'bhop_success':
                this._bhopSuccess(now, vol);
                break;
            case 'slide_start':
                this._slideStart(now, vol);
                break;
            case 'footstep':
                this._footstep(now, vol);
                break;
                
            // ─── Hit/Kill Feedback SFX (Phase 11.4) ───
            case 'hit':
                this._hitThwack(now, vol);
                break;
            case 'headshot_snap':
                this._headshotSnap(now, vol);
                break;
            case 'kill_confirm':
                this._killConfirm(now, vol);
                break;
            case 'heartbeat':
                this._heartbeat(now, vol);
                break;
            case 'damage_taken':
                this._damageTaken(now, vol);
                break;
                
            // ─── UI SFX ───
            case 'button_hover':
                this._buttonHover(now, vol);
                break;
            case 'button_click':
                this._buttonClick(now, vol);
                break;
                
            default:
                console.warn(`[AudioManager] Unknown SFX type: ${type}`);
        }
    }

    // Creates an oscillator + gain pair connected to master
    _createOscGain(vol) {
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        osc.connect(gain);
        gain.connect(this.masterVolume);
        return { osc, gain };
    }

    // Creates a noise buffer source
    _createNoise(duration, vol) {
        const sampleRate = this.context.sampleRate;
        const length = sampleRate * duration;
        const buffer = this.context.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < length; i++) {
            data[i] = (Math.random() * 2 - 1);
        }
        const source = this.context.createBufferSource();
        source.buffer = buffer;
        
        const gain = this.context.createGain();
        source.connect(gain);
        gain.connect(this.masterVolume);
        return { source, gain };
    }

    // ═══════════════════════════════════
    // WEAPON SFX
    // ═══════════════════════════════════
    
    // Assault Rifle — Short burst of noise + low-pass filter + quick decay
    _shootRifle(now, vol) {
        const { source, gain } = this._createNoise(0.15, vol);
        const filter = this.context.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(3000, now);
        filter.frequency.exponentialRampToValueAtTime(200, now + 0.12);
        
        source.disconnect();
        source.connect(filter);
        filter.connect(gain);
        
        gain.gain.setValueAtTime(0.7 * vol, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        
        source.start(now);
        source.stop(now + 0.15);
    }

    // Sniper — Low boom + high crack, longer tail
    _shootSniper(now, vol) {
        // Low boom
        const { osc: boom, gain: boomGain } = this._createOscGain(vol);
        boom.type = 'sine';
        boom.frequency.setValueAtTime(80, now);
        boom.frequency.exponentialRampToValueAtTime(30, now + 0.3);
        boomGain.gain.setValueAtTime(0.9 * vol, now);
        boomGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        boom.start(now);
        boom.stop(now + 0.3);
        
        // High crack
        const { source: crack, gain: crackGain } = this._createNoise(0.05, vol);
        const crackFilter = this.context.createBiquadFilter();
        crackFilter.type = 'highpass';
        crackFilter.frequency.value = 4000;
        crack.disconnect();
        crack.connect(crackFilter);
        crackFilter.connect(crackGain);
        crackGain.gain.setValueAtTime(0.6 * vol, now);
        crackGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        crack.start(now);
        crack.stop(now + 0.05);
    }

    // SMG — Very short, clicky burst (higher pitch than AR)
    _shootSMG(now, vol) {
        const { source, gain } = this._createNoise(0.06, vol);
        const filter = this.context.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 5000;
        filter.Q.value = 2;
        
        source.disconnect();
        source.connect(filter);
        filter.connect(gain);
        
        gain.gain.setValueAtTime(0.5 * vol, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        
        source.start(now);
        source.stop(now + 0.06);
    }

    // Shotgun — Wide noise burst + low boom
    _shootShotgun(now, vol) {
        // Wide noise
        const { source, gain } = this._createNoise(0.25, vol);
        gain.gain.setValueAtTime(0.9 * vol, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        source.start(now);
        source.stop(now + 0.25);
        
        // Low boom
        const { osc, gain: boomGain } = this._createOscGain(vol);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
        boomGain.gain.setValueAtTime(0.8 * vol, now);
        boomGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
    }

    // Pistol — Medium crack
    _shootPistol(now, vol) {
        const { osc, gain } = this._createOscGain(vol);
        osc.type = 'square';
        osc.frequency.setValueAtTime(250, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.08);
        gain.gain.setValueAtTime(0.6 * vol, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.1);
    }

    // Melee — Whoosh + thud
    _shootMelee(now, vol) {
        const { source, gain } = this._createNoise(0.1, vol);
        const filter = this.context.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.exponentialRampToValueAtTime(200, now + 0.1);
        
        source.disconnect();
        source.connect(filter);
        filter.connect(gain);
        
        gain.gain.setValueAtTime(0.5 * vol, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        source.start(now);
        source.stop(now + 0.1);
    }

    // ═══════════════════════════════════
    // MOVEMENT SFX
    // ═══════════════════════════════════
    
    // Jump — Short ascending whoosh
    _jumpSfx(now, vol) {
        const { osc, gain } = this._createOscGain(vol);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.15);
        gain.gain.setValueAtTime(0.3 * vol, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
    }

    // B-hop success — Quick ascending sweep (200→800Hz, 100ms)
    _bhopSuccess(now, vol) {
        const { osc, gain } = this._createOscGain(vol);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
        gain.gain.setValueAtTime(0.4 * vol, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
        
        // Add a click
        const { osc: click, gain: clickGain } = this._createOscGain(vol);
        click.type = 'sine';
        click.frequency.value = 1200;
        clickGain.gain.setValueAtTime(0.3 * vol, now + 0.08);
        clickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.11);
        click.start(now + 0.08);
        click.stop(now + 0.12);
    }

    // Slide start — Low rumble burst
    _slideStart(now, vol) {
        const { source, gain } = this._createNoise(0.3, vol);
        const filter = this.context.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 200;
        
        source.disconnect();
        source.connect(filter);
        filter.connect(gain);
        
        gain.gain.setValueAtTime(0.35 * vol, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
        source.start(now);
        source.stop(now + 0.3);
    }

    // Footstep — Soft tick
    _footstep(now, vol) {
        const { osc, gain } = this._createOscGain(vol);
        osc.type = 'sine';
        osc.frequency.value = 100;
        gain.gain.setValueAtTime(0.15 * vol, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.03);
        osc.start(now);
        osc.stop(now + 0.04);
    }

    // ═══════════════════════════════════
    // FEEDBACK SFX
    // ═══════════════════════════════════
    
    // Hit — High pitched pip
    _hitThwack(now, vol) {
        const { osc, gain } = this._createOscGain(vol);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, now);
        gain.gain.setValueAtTime(0.5 * vol, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
    }

    // Headshot glass snap — High-frequency burst (3kHz+) with fast decay
    _headshotSnap(now, vol) {
        const { source, gain } = this._createNoise(0.04, vol);
        const filter = this.context.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 3000;
        
        source.disconnect();
        source.connect(filter);
        filter.connect(gain);
        
        gain.gain.setValueAtTime(0.7 * vol, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
        source.start(now);
        source.stop(now + 0.04);
        
        // Add a high sine "ding"
        const { osc, gain: dingGain } = this._createOscGain(vol);
        osc.type = 'sine';
        osc.frequency.value = 4000;
        dingGain.gain.setValueAtTime(0.3 * vol, now);
        dingGain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
        osc.start(now);
        osc.stop(now + 0.06);
    }

    // Kill confirm — Satisfying ding (800Hz sine, 200ms)
    _killConfirm(now, vol) {
        const { osc, gain } = this._createOscGain(vol);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.setValueAtTime(1000, now + 0.05);
        gain.gain.setValueAtTime(0.5 * vol, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
    }

    // Heartbeat — Low thud
    _heartbeat(now, vol) {
        const { osc, gain } = this._createOscGain(vol);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(50, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.2);
        gain.gain.setValueAtTime(0.6 * vol, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
    }

    // Damage taken — Low thud with bass impact
    _damageTaken(now, vol) {
        const { osc, gain } = this._createOscGain(vol);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
        gain.gain.setValueAtTime(0.7 * vol, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
    }

    // ═══════════════════════════════════
    // UI SFX
    // ═══════════════════════════════════
    
    // Button hover — Soft tick
    _buttonHover(now, vol) {
        const { osc, gain } = this._createOscGain(vol);
        osc.type = 'sine';
        osc.frequency.value = 600;
        gain.gain.setValueAtTime(0.1 * vol, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.03);
        osc.start(now);
        osc.stop(now + 0.04);
    }

    // Button click — Short snap
    _buttonClick(now, vol) {
        const { osc, gain } = this._createOscGain(vol);
        osc.type = 'square';
        osc.frequency.value = 1000;
        gain.gain.setValueAtTime(0.2 * vol, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.05);
    }

    // --- Ambient Audio ---
    playAmbient() {
        if (this.ambientPlaying) return;
        this.ambientPlaying = true;
        
        const ctx = this.context;
        
        // Low drone oscillator
        this.ambientOsc1 = ctx.createOscillator();
        this.ambientOsc1.type = 'sawtooth';
        this.ambientOsc1.frequency.value = 55;
        
        this.ambientOsc2 = ctx.createOscillator();
        this.ambientOsc2.type = 'sine';
        this.ambientOsc2.frequency.value = 82;
        
        // Low pass filter for warmth
        this.ambientFilter = ctx.createBiquadFilter();
        this.ambientFilter.type = 'lowpass';
        this.ambientFilter.frequency.value = 200;
        this.ambientFilter.Q.value = 2;
        
        this.ambientGain = ctx.createGain();
        this.ambientGain.gain.value = 0.04 * this.volumes.music * this.volumes.master;
        
        this.ambientOsc1.connect(this.ambientFilter);
        this.ambientOsc2.connect(this.ambientFilter);
        this.ambientFilter.connect(this.ambientGain);
        this.ambientGain.connect(this.masterVolume);
        
        this.ambientOsc1.start();
        this.ambientOsc2.start();
    }
    
    stopAmbient() {
        if (!this.ambientPlaying) return;
        this.ambientPlaying = false;
        try {
            this.ambientOsc1.stop();
            this.ambientOsc2.stop();
        } catch {}
    }
}

const audioManager = new AudioManager();
export default audioManager;

