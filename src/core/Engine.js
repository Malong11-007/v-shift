import * as THREE from 'three';

class Engine {
    constructor() {
        this.canvas = null;
        this.renderer = null;
        this.scene = null;
        this.camera = null;
        this.clock = new THREE.Timer();
        
        // Modules that need updating
        this.updatables = [];
        this.updateCallbacks = [];
        this.isRunning = false;
        this.timeScale = 1.0;

        // When true, tick() runs fully every frame (PLAYING state).
        // When false, only renders every _menuFrameInterval ms so the
        // main thread stays free for UI interactions.
        this._fullSpeed = false;
        this._lastMenuRender = 0;
        this._menuFrameInterval = 200; // ms between renders in menu mode
        
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
        // 1. Renderer (enhanced for better graphics)
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            powerPreference: "high-performance",
            logarithmicDepthBuffer: true // Better depth precision for distant objects
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Shadows — PCFSoft at higher resolution
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Tone mapping for cinematic look
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.3; // Slightly increased for brighter daytime look

        // 2. Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb); // Sky blue for daytime
        this.scene.fog = new THREE.FogExp2(0xb0c4de, 0.008); // Light blue fog, less dense

        // 3. Camera (FOV 90 for good competitive feel)
        this.camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.scene.add(this.camera);

        // 4. Lighting Setup (multi-light rig)
        this._setupLighting();

        // Event Listeners
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    _setupLighting() {
        // Brighter Hemisphere Light (bright sky for daytime)
        const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x444444, 0.8);
        hemiLight.position.set(0, 50, 0);
        this.scene.add(hemiLight);

        // Increased Ambient Light (much brighter base fill)
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // Primary Directional Light (bright sun - increased intensity)
        const dirLight = new THREE.DirectionalLight(0xfff5e8, 3.0);
        dirLight.position.set(40, 80, 30);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 4096; // Increased from 2048 for better quality
        dirLight.shadow.mapSize.height = 4096;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 250;
        dirLight.shadow.camera.left = -60;
        dirLight.shadow.camera.right = 60;
        dirLight.shadow.camera.top = 60;
        dirLight.shadow.camera.bottom = -60;
        dirLight.shadow.bias = -0.0001; // Reduced for better shadow quality
        dirLight.shadow.normalBias = 0.05;
        dirLight.shadow.radius = 2; // Soft shadow edges
        this.scene.add(dirLight);
        this.dirLight = dirLight;

        // Secondary fill light (brighter cool blue rim light)
        const fillLight = new THREE.DirectionalLight(0x88bbff, 1.2);
        fillLight.position.set(-30, 40, -20);
        this.scene.add(fillLight);

        // Rim / Back light for character separation (brighter warm kick)
        const rimLight = new THREE.DirectionalLight(0xffdd99, 0.8);
        rimLight.position.set(-10, 20, -50);
        this.scene.add(rimLight);

        // Additional overhead light for even illumination
        const topLight = new THREE.DirectionalLight(0xffffff, 1.5);
        topLight.position.set(0, 100, 0);
        this.scene.add(topLight);

        // Bomb site A ambient glow (brighter)
        const siteALight = new THREE.PointLight(0xff4400, 1.2, 30, 2);
        siteALight.position.set(0, 3, 20);
        this.scene.add(siteALight);

        // Bomb site B ambient glow (brighter)
        const siteBLight = new THREE.PointLight(0x0044ff, 1.2, 30, 2);
        siteBLight.position.set(0, 3, -20);
        this.scene.add(siteBLight);

        // Additional area lights for better coverage
        const areaLight1 = new THREE.PointLight(0xffffff, 1.0, 50, 2);
        areaLight1.position.set(20, 10, 0);
        this.scene.add(areaLight1);

        const areaLight2 = new THREE.PointLight(0xffffff, 1.0, 50, 2);
        areaLight2.position.set(-20, 10, 0);
        this.scene.add(areaLight2);
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

    /**
     * Switch between full-speed rendering (during gameplay) and
     * throttled rendering (during menus).  Throttled mode only
     * renders every _menuFrameInterval ms, keeping the main thread
     * free so DOM interactions remain responsive.
     */
    setFullSpeed(enabled) {
        this._fullSpeed = enabled;
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.renderer.setAnimationLoop(this.tick.bind(this));
    }

    stop() {
        this.isRunning = false;
        this.renderer.setAnimationLoop(null);
    }

    tick() {
        // Update the timer every frame so getDelta() is accurate
        this.clock.update();

        // In menu mode, skip rendering entirely to keep the main
        // thread free for UI interactions.  Menu screens are opaque
        // overlays so the 3D scene is not visible anyway.
        if (!this._fullSpeed) {
            return;
        }

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
