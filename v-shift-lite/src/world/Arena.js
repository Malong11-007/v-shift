import * as THREE from 'three';
import physics from '../physics/PhysicsWorld.js';

class Arena {
    constructor() {
        this.group = new THREE.Group();
        this.spawnPoints = {
            player: [
                new THREE.Vector3(-35, 1, 0),
                new THREE.Vector3(-35, 1, 5),
                new THREE.Vector3(-35, 1, -5)
            ],
            bots: [
                new THREE.Vector3(35, 1, 0),
                new THREE.Vector3(35, 1, 10),
                new THREE.Vector3(35, 1, -10),
                new THREE.Vector3(25, 1, 25),
                new THREE.Vector3(25, 1, -25)
            ],
            bombSites: {
                A: new THREE.Vector3(0, 1, 20),
                B: new THREE.Vector3(0, 1, -20)
            }
        };
    }

    init() {
        // Materials
        const floorMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });
        const wallMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5 });
        const trimMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 0.2 });

        // 1. Large Ground Plane (80x80)
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.group.add(floor);
        physics.createStaticBox(0, -0.05, 0, 50, 0.05, 50);

        // 2. Outer Boundaries
        this.createWall(-50, 0, 100, 10, 'Z'); // West
        this.createWall(50, 0, 100, 10, 'Z');  // East
        this.createWall(0, -50, 100, 10, 'X'); // South
        this.createWall(0, 50, 100, 10, 'X');  // North

        // 3. Tactical 3-Lane Layout
        
        // Mid Lane Structures
        this.createBlock(0, 2, 0, 10, 4, 15); // Large Central Pillar
        this.createBlock(-15, 1, 0, 4, 2, 4);  // Mid-West Cover
        this.createBlock(15, 1, 0, 4, 2, 4);   // Mid-East Cover

        // North Lane (Site A Access)
        this.createBlock(-20, 2, 30, 20, 4, 2); // Long North Wall
        this.createBlock(20, 2, 30, 20, 4, 2);  // Long North Wall
        this.createBlock(0, 1.5, 35, 8, 3, 8, 0x333333); // Site A Platform

        // South Lane (Site B Access)
        this.createBlock(-20, 2, -30, 20, 4, 2); // Long South Wall
        this.createBlock(20, 2, -30, 20, 4, 2);  // Long South Wall
        this.createBlock(0, 1.5, -35, 8, 3, 8, 0x333333); // Site B Platform

        // Connectors (Flank routes)
        this.createBlock(-30, 2, 15, 2, 4, 10);
        this.createBlock(-30, 2, -15, 2, 4, 10);
        this.createBlock(30, 2, 15, 2, 4, 10);
        this.createBlock(30, 2, -15, 2, 4, 10);

        // Scattered Cover
        const covers = [
            { x: -10, z: 12 }, { x: 10, z: 12 },
            { x: -10, z: -12 }, { x: 10, z: -12 },
            { x: -25, z: 0 }, { x: 25, z: 0 }
        ];
        covers.forEach(c => this.createBlock(c.x, 1, c.z, 2, 2, 2, 0x444444));

        return this.group;
    }

    createWall(x, z, w, h, axis, color=0x222222) {
        const geo = axis === 'X' ? new THREE.BoxGeometry(w, h, 1) : new THREE.BoxGeometry(1, h, w);
        const wall = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color }));
        wall.position.set(x, h/2, z);
        wall.castShadow = true;
        wall.receiveShadow = true;
        this.group.add(wall);
        physics.createStaticBox(x, h/2, z, axis === 'X' ? w/2 : 0.5, h/2, axis === 'X' ? 0.5 : w/2);
    }

    createBlock(x, y, z, w, h, d, color=0x222222) {
        const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color }));
        wall.position.set(x, y, z);
        wall.castShadow = true;
        wall.receiveShadow = true;
        this.group.add(wall);
        physics.createStaticBox(x, y, z, w/2, h/2, d/2);
    }

    getPlayerSpawn() {
        return this.spawnPoints.player[Math.floor(Math.random() * this.spawnPoints.player.length)];
    }

    getBotSpawn() {
        return this.spawnPoints.bots[Math.floor(Math.random() * this.spawnPoints.bots.length)];
    }
}

const arena = new Arena();
export default arena;
