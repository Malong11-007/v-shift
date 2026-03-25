import * as THREE from 'three';
import physics from '../physics/PhysicsWorld.js';

class Arena {
    constructor() {
        this.group = new THREE.Group();
        this.spawnPoints = {
            player: [
                new THREE.Vector3(-35, 1, 0),
                new THREE.Vector3(-35, 1, 5),
                new THREE.Vector3(-35, 1, -5),
                new THREE.Vector3(-35, 1, 10),
                new THREE.Vector3(-35, 1, -10),
                new THREE.Vector3(-38, 1, 3),
                new THREE.Vector3(-38, 1, -3),
                new THREE.Vector3(-38, 1, 8),
                new THREE.Vector3(-38, 1, -8),
                new THREE.Vector3(-32, 1, 0)
            ],
            bots: [
                new THREE.Vector3(35, 1, 0),
                new THREE.Vector3(35, 1, 10),
                new THREE.Vector3(35, 1, -10),
                new THREE.Vector3(25, 1, 25),
                new THREE.Vector3(25, 1, -25),
                new THREE.Vector3(38, 1, 5),
                new THREE.Vector3(38, 1, -5),
                new THREE.Vector3(38, 1, 15),
                new THREE.Vector3(38, 1, -15),
                new THREE.Vector3(32, 1, 0)
            ],
            bombSites: {
                A: new THREE.Vector3(0, 1, 20),
                B: new THREE.Vector3(0, 1, -20)
            }
        };
    }

    init() {
        // Materials (enhanced PBR)
        const floorMat = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.85, metalness: 0.05 });
        const wallMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5, metalness: 0.1 });
        const trimMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 0.3, roughness: 0.2, metalness: 0.5 });
        const coverMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6, metalness: 0.1 });
        const siteAMat = new THREE.MeshStandardMaterial({ color: 0x443322, roughness: 0.7, metalness: 0.1 });
        const siteBMat = new THREE.MeshStandardMaterial({ color: 0x222244, roughness: 0.7, metalness: 0.1 });

        // 1. Large Ground Plane (100x100) with grid texture effect
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(100, 100, 10, 10), floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.group.add(floor);
        physics.createStaticBox(0, -0.05, 0, 50, 0.05, 50);

        // Floor lane markings (subtle center-line guides)
        for (let i = -4; i <= 4; i++) {
            if (i === 0) continue;
            const line = new THREE.Mesh(
                new THREE.BoxGeometry(0.05, 0.005, 80),
                new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 })
            );
            line.position.set(i * 10, 0.005, 0);
            this.group.add(line);
        }

        // 2. Outer Boundaries with accent trim
        this.createWall(-50, 0, 100, 10, 'Z');
        this.createWall(50, 0, 100, 10, 'Z');
        this.createWall(0, -50, 100, 10, 'X');
        this.createWall(0, 50, 100, 10, 'X');

        // Wall base trim lights (glowing cyan strips along walls)
        const wallTrimPositions = [
            { x: -49.5, z: 0, rot: 0, len: 96 },
            { x: 49.5, z: 0, rot: 0, len: 96 },
            { x: 0, z: -49.5, rot: Math.PI / 2, len: 96 },
            { x: 0, z: 49.5, rot: Math.PI / 2, len: 96 }
        ];
        wallTrimPositions.forEach(wt => {
            const trim = new THREE.Mesh(
                new THREE.BoxGeometry(0.08, 0.08, wt.len),
                trimMat
            );
            trim.position.set(wt.x, 0.05, wt.z);
            trim.rotation.y = wt.rot;
            this.group.add(trim);
        });

        // 3. Tactical 3-Lane Layout
        
        // Mid Lane Structures
        this.createBlock(0, 2, 0, 10, 4, 15);
        this.createBlock(-15, 1, 0, 4, 2, 4, 0x2a2a2a);
        this.createBlock(15, 1, 0, 4, 2, 4, 0x2a2a2a);

        // North Lane (Site A Access)
        this.createBlock(-20, 2, 30, 20, 4, 2);
        this.createBlock(20, 2, 30, 20, 4, 2);
        this.createBlock(0, 1.5, 35, 8, 3, 8, 0x333333);

        // South Lane (Site B Access)
        this.createBlock(-20, 2, -30, 20, 4, 2);
        this.createBlock(20, 2, -30, 20, 4, 2);
        this.createBlock(0, 1.5, -35, 8, 3, 8, 0x333333);

        // Connectors (Flank routes)
        this.createBlock(-30, 2, 15, 2, 4, 10);
        this.createBlock(-30, 2, -15, 2, 4, 10);
        this.createBlock(30, 2, 15, 2, 4, 10);
        this.createBlock(30, 2, -15, 2, 4, 10);

        // Scattered Cover (with varied materials)
        const covers = [
            { x: -10, z: 12 }, { x: 10, z: 12 },
            { x: -10, z: -12 }, { x: 10, z: -12 },
            { x: -25, z: 0 }, { x: 25, z: 0 }
        ];
        covers.forEach(c => this.createBlock(c.x, 1, c.z, 2, 2, 2, 0x3a3a3a));

        // 4. Bomb Site Markers
        this._createBombSite('A', 0, 20, siteAMat, 0xff4400);
        this._createBombSite('B', 0, -20, siteBMat, 0x0044ff);

        // 5. Industrial props near sites
        this._createIndustrialProps();

        return this.group;
    }

    _createBombSite(label, x, z, siteMat, glowColor) {
        // Ground marker ring
        const ring = new THREE.Mesh(
            new THREE.RingGeometry(2.5, 3.0, 32),
            new THREE.MeshStandardMaterial({
                color: glowColor, emissive: glowColor, emissiveIntensity: 0.5,
                transparent: true, opacity: 0.6, side: THREE.DoubleSide
            })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(x, 0.02, z);
        this.group.add(ring);

        // Inner filled circle
        const inner = new THREE.Mesh(
            new THREE.CircleGeometry(2.4, 32),
            new THREE.MeshStandardMaterial({
                color: glowColor, emissive: glowColor, emissiveIntensity: 0.15,
                transparent: true, opacity: 0.2, side: THREE.DoubleSide
            })
        );
        inner.rotation.x = -Math.PI / 2;
        inner.position.set(x, 0.015, z);
        this.group.add(inner);

        // Vertical marker post
        const post = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.05, 1.5, 8),
            new THREE.MeshStandardMaterial({ color: glowColor, emissive: glowColor, emissiveIntensity: 0.4 })
        );
        post.position.set(x + 3.5, 0.75, z);
        this.group.add(post);

        // Holographic label at top of post
        const labelGeo = new THREE.BoxGeometry(0.8, 0.4, 0.02);
        const labelMesh = new THREE.Mesh(labelGeo, new THREE.MeshStandardMaterial({
            color: glowColor, emissive: glowColor, emissiveIntensity: 0.8,
            transparent: true, opacity: 0.7
        }));
        labelMesh.position.set(x + 3.5, 1.7, z);
        this.group.add(labelMesh);
    }

    _createIndustrialProps() {
        const metalMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.4, metalness: 0.7 });

        // Pipe runs along walls
        for (const z of [-40, 40]) {
            const pipe = new THREE.Mesh(
                new THREE.CylinderGeometry(0.12, 0.12, 30, 8),
                metalMat
            );
            pipe.rotation.z = Math.PI / 2;
            pipe.position.set(0, 3, z);
            this.group.add(pipe);

            // Pipe brackets
            for (let i = -3; i <= 3; i++) {
                const bracket = new THREE.Mesh(
                    new THREE.BoxGeometry(0.15, 0.4, 0.15),
                    metalMat
                );
                bracket.position.set(i * 4, 3.2, z);
                this.group.add(bracket);
            }
        }

        // Ventilation grates on central structure
        for (const side of [-1, 1]) {
            const grate = new THREE.Mesh(
                new THREE.BoxGeometry(0.05, 1.5, 3),
                new THREE.MeshStandardMaterial({
                    color: 0x1a1a1a, roughness: 0.3, metalness: 0.8
                })
            );
            grate.position.set(side * 5.05, 2.5, 0);
            this.group.add(grate);
        }
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

    getPlayerSpawns(count) {
        const spawns = [];
        const available = [...this.spawnPoints.player];
        const n = Math.min(count, available.length);
        for (let i = 0; i < n; i++) {
            const idx = Math.floor(Math.random() * available.length);
            spawns.push(available.splice(idx, 1)[0]);
        }
        return spawns;
    }

    getBotSpawns(count) {
        const spawns = [];
        const available = [...this.spawnPoints.bots];
        const n = Math.min(count, available.length);
        for (let i = 0; i < n; i++) {
            const idx = Math.floor(Math.random() * available.length);
            spawns.push(available.splice(idx, 1)[0]);
        }
        return spawns;
    }
}

const arena = new Arena();
export default arena;
