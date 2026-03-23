import * as THREE from 'three';
import physics from '../physics/PhysicsWorld.js';

export default class TestRoom {
    constructor() {
        this.group = new THREE.Group();
        
        // Simple checkerboard or grid material for testing
        const texLoader = new THREE.TextureLoader();
        const gridTex = texLoader.load('/assets/Textures/Rocks_Diffuse.png'); // Fallback to rock if grid not available
        gridTex.wrapS = THREE.RepeatWrapping;
        gridTex.wrapT = THREE.RepeatWrapping;
        gridTex.repeat.set(50, 50);
        gridTex.colorSpace = THREE.SRGBColorSpace;
        
        this.floorMat = new THREE.MeshStandardMaterial({ 
            map: gridTex, 
            color: 0xcccccc, 
            roughness: 0.8 
        });
    }

    init() {
        // Giant flat plane: 200x200
        const floorGeo = new THREE.BoxGeometry(200, 2, 200);
        const floorMesh = new THREE.Mesh(floorGeo, this.floorMat);
        floorMesh.position.set(0, -1, 0); // Top surface is at y=0
        floorMesh.receiveShadow = true;
        this.group.add(floorMesh);
        
        // Add dedicated Test Room lighting since Arena is bypassed
        const sun = new THREE.DirectionalLight(0xffffff, 2.5);
        sun.position.set(50, 100, 50);
        sun.castShadow = true;
        sun.shadow.mapSize.width = 2048;
        sun.shadow.mapSize.height = 2048;
        this.group.add(sun);
        
        const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
        hemi.position.set(0, 50, 0);
        this.group.add(hemi);
        
        if (physics.world && physics.RAPIER) {
            physics.createStaticBox(0, -1, 0, 100, 1, 100);
        }
    }
}
