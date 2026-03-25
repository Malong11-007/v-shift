import * as THREE from 'three';

class Engine {
    constructor() {
        this.canvas = null;
        this.renderer = null;
        this.scene = null;
        this.camera = null;
        this.clock = new THREE.Clock();
        
        // Modules that need updating
        this.updatables = [];
        this.updateCallbacks = [];
        this.isRunning = false;
        this.timeScale = 1.0;
        
        this.init();
    }

    getCanvas() {
        if (!this.canvas) {
            this.canvas = document.getElementById('game-canvas');
        }
        return this.canvas;
    }

    init() {
        const canvas = this.getCanvas();
        // 1. Renderer (enhanced)
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: canvas, 
            antialias: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Shadows — PCFSoft at higher resolution
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Tone mapping for cinematic look
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.1;

        // 2. Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0f0f13);
        this.scene.fog = new THREE.FogExp2(0x0f0f13, 0.012);

        // 3. Camera (FOV 90 for good competitive feel)
        this.camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.scene.add(this.camera);

        // 4. Lighting Setup (multi-light rig)
        this._setupLighting();

        // Event Listeners
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    _setupLighting() {
        // Hemisphere Light (sky/ground ambient fill)
        const hemiLight = new THREE.HemisphereLight(0x3344aa, 0x111111, 0.4);
        hemiLight.position.set(0, 50, 0);
        this.scene.add(hemiLight);

        // Ambient Light (base fill to prevent pure black shadows)
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.25);
        this.scene.add(ambientLight);

        // Primary Directional Light (sun/moon — warm key light)
        const dirLight = new THREE.DirectionalLight(0xffe8d0, 1.8);
        dirLight.position.set(40, 80, 30);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 4096;
        dirLight.shadow.mapSize.height = 4096;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 250;
        dirLight.shadow.camera.left = -60;
        dirLight.shadow.camera.right = 60;
        dirLight.shadow.camera.top = 60;
        dirLight.shadow.camera.bottom = -60;
        dirLight.shadow.bias = -0.0005;
        dirLight.shadow.normalBias = 0.02;
        this.scene.add(dirLight);
        this.dirLight = dirLight;

        // Secondary fill light (cool blue rim light from opposite side)
        const fillLight = new THREE.DirectionalLight(0x4488cc, 0.5);
        fillLight.position.set(-30, 40, -20);
        this.scene.add(fillLight);

        // Rim / Back light for character separation (subtle warm kick from behind)
        const rimLight = new THREE.DirectionalLight(0xffcc88, 0.3);
        rimLight.position.set(-10, 20, -50);
        this.scene.add(rimLight);

        // Bomb site A ambient glow
        const siteALight = new THREE.PointLight(0xff4400, 0.6, 25, 2);
        siteALight.position.set(0, 3, 20);
        this.scene.add(siteALight);

        // Bomb site B ambient glow
        const siteBLight = new THREE.PointLight(0x0044ff, 0.6, 25, 2);
        siteBLight.position.set(0, 3, -20);
        this.scene.add(siteBLight);
    }

    onWindowResize() {
        if (!this.camera || !this.renderer) return;
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    addUpdatable(obj) {
        if (obj.update && typeof obj.update === 'function') {
            this.updatables.push(obj);
        }
    }

    onUpdate(callback) {
        if (typeof callback === 'function') {
            this.updateCallbacks.push(callback);
        }
    }

    removeUpdatable(obj) {
        this.updatables = this.updatables.filter(u => u !== obj);
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.clock.start();
        this.renderer.setAnimationLoop(this.tick.bind(this));
    }

    stop() {
        this.isRunning = false;
        this.renderer.setAnimationLoop(null);
    }

    tick() {
        // Apply time scale to delta
        const delta = this.clock.getDelta() * this.timeScale;
        
        // Update all registered systems (physics, player, etc.)
        for (const sys of this.updatables) {
            sys.update(delta);
        }

        // Run callbacks
        for (const cb of this.updateCallbacks) {
            cb(delta);
        }

        // Render scene
        this.renderer.render(this.scene, this.camera);
    }
}

// Export as singleton
const engine = new Engine();
export default engine;
