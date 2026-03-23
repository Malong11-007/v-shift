import gameState, { STATES } from '../core/GameState.js';
import audioManager from '../core/AudioManager.js';

class Settings {
    constructor() {
        this.container = document.createElement('div');
        this.container.style.position = 'absolute';
        this.container.style.top = '0';
        this.container.style.left = '0';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.backgroundColor = 'rgba(10, 10, 10, 0.95)';
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';
        this.container.style.justifyContent = 'flex-start';
        this.container.style.alignItems = 'center';
        this.container.style.paddingTop = '60px';
        this.container.style.color = '#fff';
        this.container.style.fontFamily = 'Inter, sans-serif';
        this.container.style.zIndex = '2000';
        this.container.style.pointerEvents = 'auto';
        this.container.style.overflowY = 'auto';

        // Header
        const header = document.createElement('div');
        header.style.width = '100%';
        header.style.maxWidth = '600px';
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.marginBottom = '40px';

        this.title = document.createElement('h2');
        this.title.innerText = 'SYSTEM SETTINGS';
        this.title.style.fontSize = '36px';
        this.title.style.letterSpacing = '5px';
        this.title.style.textShadow = '0 0 15px #00f0ff';
        header.appendChild(this.title);

        const backBtn = document.createElement('button');
        backBtn.innerText = '← BACK';
        backBtn.style.padding = '10px 20px';
        backBtn.style.backgroundColor = 'transparent';
        backBtn.style.color = '#aaa';
        backBtn.style.border = '1px solid #555';
        backBtn.style.cursor = 'pointer';
        backBtn.style.fontFamily = 'Inter, sans-serif';
        backBtn.style.fontWeight = 'bold';
        backBtn.addEventListener('click', () => {
            this.saveSettings();
            if (gameState.previousState === STATES.PAUSED) {
                gameState.transition(STATES.PAUSED);
            } else {
                gameState.transition(STATES.MAIN_MENU);
            }
        });
        header.appendChild(backBtn);
        this.container.appendChild(header);

        // Settings panel
        this.panel = document.createElement('div');
        this.panel.style.width = '100%';
        this.panel.style.maxWidth = '600px';
        this.panel.style.display = 'flex';
        this.panel.style.flexDirection = 'column';
        this.panel.style.gap = '25px';
        this.container.appendChild(this.panel);

        // Load saved settings
        this.settings = this.loadSettings();

        // --- AUDIO Section ---
        this.addSectionHeader('AUDIO');
        this.masterSlider = this.addSlider('Master Volume', 0, 100, this.settings.masterVolume, (val) => {
            this.settings.masterVolume = val;
            audioManager.setVolume('master', val / 100);
        });
        this.sfxSlider = this.addSlider('SFX Volume', 0, 100, this.settings.sfxVolume, (val) => {
            this.settings.sfxVolume = val;
            audioManager.setVolume('sfx', val / 100);
        });
        this.musicSlider = this.addSlider('Music Volume', 0, 100, this.settings.musicVolume, (val) => {
            this.settings.musicVolume = val;
            audioManager.setVolume('music', val / 100);
        });

        // --- MOUSE Section ---
        this.addSectionHeader('MOUSE & AIM');
        this.sensSlider = this.addSlider('Mouse Sensitivity', 0.1, 10, this.settings.sensitivity, (val) => {
            this.settings.sensitivity = val;
            window.dispatchEvent(new CustomEvent('sensitivityChanged', { detail: val }));
        }, 0.1);

        // --- CROSSHAIR Section ---
        this.addSectionHeader('CROSSHAIR');
        this.crosshairColor = this.addColorPicker('Crosshair Color', this.settings.crosshairColor, (val) => {
            this.settings.crosshairColor = val;
            window.dispatchEvent(new CustomEvent('crosshairColorChanged', { detail: val }));
        });
        this.crosshairSizeSlider = this.addSlider('Crosshair Size', 1, 10, this.settings.crosshairSize, (val) => {
            this.settings.crosshairSize = val;
            window.dispatchEvent(new CustomEvent('crosshairSizeChanged', { detail: val }));
        }, 1);

        // --- DISPLAY Section ---
        this.addSectionHeader('DISPLAY');
        this.fovSlider = this.addSlider('Field of View', 60, 120, this.settings.fov, (val) => {
            this.settings.fov = val;
            window.dispatchEvent(new CustomEvent('fovChanged', { detail: val }));
        }, 1);
        this.showFpsToggle = this.addToggle('Show FPS Counter', this.settings.showFps, (val) => {
            this.settings.showFps = val;
            window.dispatchEvent(new CustomEvent('showFpsChanged', { detail: val }));
        });
    }

    addSectionHeader(text) {
        const header = document.createElement('div');
        header.innerText = text;
        header.style.fontSize = '14px';
        header.style.letterSpacing = '3px';
        header.style.color = '#00f0ff';
        header.style.borderBottom = '1px solid #333';
        header.style.paddingBottom = '8px';
        header.style.marginTop = '10px';
        this.panel.appendChild(header);
    }

    addSlider(label, min, max, defaultVal, onChange, step = 1) {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.gap = '15px';

        const lbl = document.createElement('label');
        lbl.innerText = label;
        lbl.style.flex = '1';
        lbl.style.color = '#ccc';
        lbl.style.fontSize = '15px';
        row.appendChild(lbl);

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = min;
        slider.max = max;
        slider.step = step;
        slider.value = defaultVal;
        slider.style.flex = '1.5';
        slider.style.accentColor = '#00f0ff';
        slider.style.cursor = 'pointer';
        row.appendChild(slider);

        const valDisplay = document.createElement('span');
        valDisplay.innerText = defaultVal;
        valDisplay.style.width = '45px';
        valDisplay.style.textAlign = 'right';
        valDisplay.style.color = '#fff';
        valDisplay.style.fontFamily = 'monospace';
        valDisplay.style.fontSize = '14px';
        row.appendChild(valDisplay);

        slider.addEventListener('input', () => {
            const val = parseFloat(slider.value);
            valDisplay.innerText = Number.isInteger(val) ? val : val.toFixed(1);
            onChange(val);
        });

        this.panel.appendChild(row);
        return slider;
    }

    addColorPicker(label, defaultVal, onChange) {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.gap = '15px';

        const lbl = document.createElement('label');
        lbl.innerText = label;
        lbl.style.flex = '1';
        lbl.style.color = '#ccc';
        lbl.style.fontSize = '15px';
        row.appendChild(lbl);

        const picker = document.createElement('input');
        picker.type = 'color';
        picker.value = defaultVal;
        picker.style.width = '50px';
        picker.style.height = '35px';
        picker.style.cursor = 'pointer';
        picker.style.border = '2px solid #333';
        picker.style.borderRadius = '4px';
        picker.style.backgroundColor = 'transparent';
        row.appendChild(picker);

        picker.addEventListener('input', () => onChange(picker.value));
        
        this.panel.appendChild(row);
        return picker;
    }

    addToggle(label, defaultVal, onChange) {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.gap = '15px';

        const lbl = document.createElement('label');
        lbl.innerText = label;
        lbl.style.flex = '1';
        lbl.style.color = '#ccc';
        lbl.style.fontSize = '15px';
        row.appendChild(lbl);

        const toggle = document.createElement('button');
        let active = defaultVal;
        toggle.innerText = active ? 'ON' : 'OFF';
        toggle.style.padding = '8px 24px';
        toggle.style.backgroundColor = active ? '#00f0ff' : '#333';
        toggle.style.color = active ? '#000' : '#aaa';
        toggle.style.border = 'none';
        toggle.style.cursor = 'pointer';
        toggle.style.fontWeight = 'bold';
        toggle.style.borderRadius = '4px';
        toggle.style.transition = 'all 0.2s';

        toggle.addEventListener('click', () => {
            active = !active;
            toggle.innerText = active ? 'ON' : 'OFF';
            toggle.style.backgroundColor = active ? '#00f0ff' : '#333';
            toggle.style.color = active ? '#000' : '#aaa';
            onChange(active);
        });

        row.appendChild(toggle);
        this.panel.appendChild(row);
        return toggle;
    }

    loadSettings() {
        const saved = localStorage.getItem('vshift_settings');
        const defaults = {
            masterVolume: 80,
            sfxVolume: 80,
            musicVolume: 50,
            sensitivity: 2.0,
            crosshairColor: '#00ff00',
            crosshairSize: 4,
            fov: 90,
            showFps: false
        };
        if (saved) {
            try {
                return { ...defaults, ...JSON.parse(saved) };
            } catch { return defaults; }
        }
        return defaults;
    }

    saveSettings() {
        localStorage.setItem('vshift_settings', JSON.stringify(this.settings));
    }

    show(payload) {
        this.container.style.display = 'flex';
    }

    hide() {
        this.container.style.display = 'none';
        this.saveSettings();
    }
}

export default Settings;
