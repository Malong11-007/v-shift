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
        // 1. Renderer
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: canvas, 
            antialias: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        // Soft shadows and good lighting calculations
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // 2. Scene
        this.scene = new THREE.Scene();
        // Fallback dark background
        this.scene.background = new THREE.Color(0x0f0f13);
        this.scene.fog = new THREE.FogExp2(0x0f0f13, 0.015);

        // 3. Camera (FOV 90 for good competitive feel)
        this.camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.scene.add(this.camera);

        // 4. Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
        dirLight.position.set(50, 100, 50);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 200;
        dirLight.shadow.camera.left = -50;
        dirLight.shadow.camera.right = 50;
        dirLight.shadow.camera.top = 50;
        dirLight.shadow.camera.bottom = -50;
        this.scene.add(dirLight);

        // Event Listeners
        window.addEventListener('resize', this.onWindowResize.bind(this));
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
