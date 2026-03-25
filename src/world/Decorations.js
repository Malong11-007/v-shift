import * as THREE from 'three';

class Decorations {
    constructor() {
        this.group = new THREE.Group();
        
        // Enhanced materials with PBR tuning
        this.materials = {
            trunk: new THREE.MeshStandardMaterial({ color: 0x2e1a1a, roughness: 0.95, metalness: 0.0 }),
            foliage: new THREE.MeshStandardMaterial({ color: 0x1a2e1a, roughness: 0.9, flatShading: true }),
            rock: new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.85, flatShading: true }),
            crate: new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 0.9, metalness: 0.05 }),
            crateEdge: new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 0.85, metalness: 0.1 }),
            metal: new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.4, metalness: 0.7 }),
            barrel: new THREE.MeshStandardMaterial({ color: 0x2a3522, roughness: 0.7, metalness: 0.3 }),
            barrelRust: new THREE.MeshStandardMaterial({ color: 0x6b3a22, roughness: 0.95, metalness: 0.15 }),
            sandbag: new THREE.MeshStandardMaterial({ color: 0x8b7d5a, roughness: 1.0, metalness: 0.0 }),
            concrete: new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.9, metalness: 0.05 }),
            wire: new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.3, metalness: 0.8 }),
            lampPost: new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.5, metalness: 0.6 }),
            puddle: new THREE.MeshStandardMaterial({
                color: 0x111122, roughness: 0.05, metalness: 0.9, transparent: true, opacity: 0.6
            })
        };
    }

    async init() {
        this.createProceduralTrees(20);
        this.createProceduralRocks(15);
        this.createCrates(12);
        this.createBarrels(8);
        this.createSandbagWalls(6);
        this.createLampPosts(8);
        this.createPuddles(10);
        this.createDebris(20);
        this.createBarbedWire(4);
    }
    
    createProceduralTrees(count) {
        for (let i = 0; i < count; i++) {
            const tree = new THREE.Group();
            
            // Trunk (higher poly cylinder instead of box)
            const trunkGeo = new THREE.CylinderGeometry(0.2, 0.35, 3.5, 8);
            const trunk = new THREE.Mesh(trunkGeo, this.materials.trunk);
            trunk.position.y = 1.75;
            tree.add(trunk);

            // Bark detail rings
            for (let r = 0; r < 3; r++) {
                const ring = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.37, 0.37, 0.05, 8),
                    this.materials.trunk
                );
                ring.position.y = 0.8 + r * 0.9;
                tree.add(ring);
            }
            
            // Foliage (layered cones with random variation)
            for (let j = 0; j < 4; j++) {
                const radius = 2.2 - j * 0.4 + (Math.random() * 0.3 - 0.15);
                const foliage = new THREE.Mesh(
                    new THREE.ConeGeometry(radius, 1.8, 8),
                    this.materials.foliage
                );
                foliage.position.y = 3.0 + j * 1.2;
                foliage.rotation.y = Math.random() * Math.PI;
                tree.add(foliage);
            }

            // Exposed roots
            for (let r = 0; r < 3; r++) {
                const root = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.06, 0.02, 0.8, 6),
                    this.materials.trunk
                );
                const angle = (r / 3) * Math.PI * 2 + Math.random() * 0.5;
                root.position.set(Math.cos(angle) * 0.3, 0.1, Math.sin(angle) * 0.3);
                root.rotation.z = Math.cos(angle) * 0.8;
                root.rotation.x = Math.sin(angle) * 0.3;
                tree.add(root);
            }
            
            this.placeRandomly(tree, 35, 70);
            this.group.add(tree);
        }
    }

    createProceduralRocks(count) {
        for (let i = 0; i < count; i++) {
            const rockGroup = new THREE.Group();
            const size = 1 + Math.random() * 2;

            // Main rock body (higher detail)
            const mainRock = new THREE.Mesh(
                new THREE.DodecahedronGeometry(size, 1),
                this.materials.rock
            );
            mainRock.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
            mainRock.scale.y *= 0.6;
            rockGroup.add(mainRock);

            // Smaller attached rocks
            for (let j = 0; j < 2; j++) {
                const smallRock = new THREE.Mesh(
                    new THREE.DodecahedronGeometry(size * 0.35, 0),
                    this.materials.rock
                );
                smallRock.position.set(
                    (Math.random() - 0.5) * size,
                    -size * 0.2,
                    (Math.random() - 0.5) * size
                );
                smallRock.rotation.set(Math.random() * 6, Math.random() * 6, 0);
                rockGroup.add(smallRock);
            }
            
            this.placeRandomly(rockGroup, 25, 60);
            this.group.add(rockGroup);
        }
    }

    createCrates(count) {
        for (let i = 0; i < count; i++) {
            const crateGroup = new THREE.Group();
            const size = 0.6 + Math.random() * 0.6;

            // Main crate body
            const crate = new THREE.Mesh(
                new THREE.BoxGeometry(size, size, size),
                this.materials.crate
            );
            crate.position.y = size / 2;
            crateGroup.add(crate);

            // Edge reinforcement strips
            const edgeSize = size + 0.02;
            const stripGeo = new THREE.BoxGeometry(edgeSize, 0.03, 0.03);
            const stripGeo2 = new THREE.BoxGeometry(0.03, edgeSize, 0.03);
            const stripGeo3 = new THREE.BoxGeometry(0.03, 0.03, edgeSize);

            // Bottom edges
            for (const [dx, dz] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
                const strip = new THREE.Mesh(stripGeo2, this.materials.crateEdge);
                strip.position.set(dx * size / 2, size / 2, dz * size / 2);
                crateGroup.add(strip);
            }

            // Top and bottom frame edges
            for (const dy of [0.01, size]) {
                const s1 = new THREE.Mesh(stripGeo, this.materials.crateEdge);
                s1.position.set(0, dy, size / 2);
                crateGroup.add(s1);
                const s2 = new THREE.Mesh(stripGeo, this.materials.crateEdge);
                s2.position.set(0, dy, -size / 2);
                crateGroup.add(s2);
                const s3 = new THREE.Mesh(stripGeo3, this.materials.crateEdge);
                s3.position.set(size / 2, dy, 0);
                crateGroup.add(s3);
                const s4 = new THREE.Mesh(stripGeo3, this.materials.crateEdge);
                s4.position.set(-size / 2, dy, 0);
                crateGroup.add(s4);
            }

            // Stencil marking (accent stripe)
            const marking = new THREE.Mesh(
                new THREE.BoxGeometry(size * 0.6, size * 0.15, 0.005),
                new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.9 })
            );
            marking.position.set(0, size / 2, size / 2 + 0.01);
            crateGroup.add(marking);

            // Random rotation for stacking variation
            crateGroup.rotation.y = Math.floor(Math.random() * 4) * (Math.PI / 2);

            this.placeRandomly(crateGroup, 20, 48);
            this.group.add(crateGroup);
        }
    }

    createBarrels(count) {
        for (let i = 0; i < count; i++) {
            const barrelGroup = new THREE.Group();

            // Barrel body
            const body = new THREE.Mesh(
                new THREE.CylinderGeometry(0.35, 0.35, 1.1, 16),
                i % 3 === 0 ? this.materials.barrelRust : this.materials.barrel
            );
            body.position.y = 0.55;
            barrelGroup.add(body);

            // Top and bottom rims
            for (const y of [0.05, 1.05]) {
                const rim = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.37, 0.37, 0.04, 16),
                    this.materials.metal
                );
                rim.position.y = y;
                barrelGroup.add(rim);
            }

            // Center band
            const band = new THREE.Mesh(
                new THREE.CylinderGeometry(0.36, 0.36, 0.03, 16),
                this.materials.metal
            );
            band.position.y = 0.55;
            barrelGroup.add(band);

            // Top cap
            const cap = new THREE.Mesh(
                new THREE.CylinderGeometry(0.33, 0.33, 0.02, 16),
                this.materials.metal
            );
            cap.position.y = 1.09;
            barrelGroup.add(cap);

            // Tilt some barrels slightly
            if (Math.random() > 0.6) {
                barrelGroup.rotation.z = (Math.random() - 0.5) * 0.2;
            }

            this.placeRandomly(barrelGroup, 18, 45);
            this.group.add(barrelGroup);
        }
    }

    createSandbagWalls(count) {
        for (let i = 0; i < count; i++) {
            const wall = new THREE.Group();
            const layers = 2 + Math.floor(Math.random() * 2);
            const width = 3 + Math.floor(Math.random() * 3);

            for (let layer = 0; layer < layers; layer++) {
                const offset = layer % 2 === 0 ? 0 : 0.2;
                for (let b = 0; b < width; b++) {
                    const bag = new THREE.Mesh(
                        new THREE.BoxGeometry(0.5, 0.2, 0.3),
                        this.materials.sandbag
                    );
                    bag.position.set(b * 0.45 - (width * 0.45) / 2 + offset, layer * 0.18 + 0.1, 0);
                    bag.rotation.y = (Math.random() - 0.5) * 0.1;
                    bag.scale.set(
                        1 + (Math.random() - 0.5) * 0.1,
                        1 + (Math.random() - 0.5) * 0.15,
                        1 + (Math.random() - 0.5) * 0.1
                    );
                    wall.add(bag);
                }
            }

            this.placeRandomly(wall, 15, 42);
            this.group.add(wall);
        }
    }

    createLampPosts(count) {
        for (let i = 0; i < count; i++) {
            const lamp = new THREE.Group();

            // Post
            const post = new THREE.Mesh(
                new THREE.CylinderGeometry(0.08, 0.1, 5, 8),
                this.materials.lampPost
            );
            post.position.y = 2.5;
            lamp.add(post);

            // Base plate
            const base = new THREE.Mesh(
                new THREE.CylinderGeometry(0.3, 0.35, 0.15, 8),
                this.materials.lampPost
            );
            base.position.y = 0.075;
            lamp.add(base);

            // Arm
            const arm = new THREE.Mesh(
                new THREE.CylinderGeometry(0.04, 0.04, 1.2, 6),
                this.materials.lampPost
            );
            arm.rotation.z = Math.PI / 2;
            arm.position.set(0.5, 4.8, 0);
            lamp.add(arm);

            // Lamp housing
            const housing = new THREE.Mesh(
                new THREE.BoxGeometry(0.3, 0.12, 0.2),
                this.materials.lampPost
            );
            housing.position.set(1.0, 4.7, 0);
            lamp.add(housing);

            // Light source (actual point light)
            const light = new THREE.PointLight(0xffddaa, 0.8, 15, 2);
            light.position.set(1.0, 4.6, 0);
            light.castShadow = false; // Performance: don't shadow from these
            lamp.add(light);

            // Light glow sprite
            const glowSprite = new THREE.Sprite(new THREE.SpriteMaterial({
                color: 0xffddaa,
                transparent: true,
                opacity: 0.4,
                blending: THREE.AdditiveBlending
            }));
            glowSprite.scale.set(0.6, 0.6, 1);
            glowSprite.position.set(1.0, 4.6, 0);
            lamp.add(glowSprite);

            this.placeRandomly(lamp, 30, 55);
            this.group.add(lamp);
        }
    }

    createPuddles(count) {
        for (let i = 0; i < count; i++) {
            const size = 1 + Math.random() * 2;
            const puddle = new THREE.Mesh(
                new THREE.CircleGeometry(size, 16),
                this.materials.puddle
            );
            puddle.rotation.x = -Math.PI / 2;
            puddle.position.y = 0.01; // Just above ground

            this.placeRandomly(puddle, 10, 45);
            this.group.add(puddle);
        }
    }

    createDebris(count) {
        const debrisMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.9, flatShading: true });
        for (let i = 0; i < count; i++) {
            const type = Math.random();
            let debris;

            if (type < 0.33) {
                // Concrete chunk
                debris = new THREE.Mesh(
                    new THREE.DodecahedronGeometry(0.15 + Math.random() * 0.2, 0),
                    debrisMat
                );
            } else if (type < 0.66) {
                // Flat slab
                debris = new THREE.Mesh(
                    new THREE.BoxGeometry(0.4 + Math.random() * 0.3, 0.05, 0.3 + Math.random() * 0.2),
                    debrisMat
                );
            } else {
                // Pipe fragment
                debris = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.03, 0.03, 0.3 + Math.random() * 0.4, 6),
                    this.materials.metal
                );
                debris.rotation.z = Math.random() * Math.PI;
            }

            debris.position.y = 0.05;
            debris.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

            this.placeRandomly(debris, 10, 40);
            this.group.add(debris);
        }
    }

    createBarbedWire(count) {
        for (let i = 0; i < count; i++) {
            const wireGroup = new THREE.Group();

            // Posts
            for (const x of [-1, 1]) {
                const wirePost = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.03, 0.03, 1.0, 6),
                    this.materials.metal
                );
                wirePost.position.set(x * 1.5, 0.5, 0);
                wireGroup.add(wirePost);
            }

            // Wire strands
            for (let w = 0; w < 3; w++) {
                const wire = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.005, 0.005, 3.0, 4),
                    this.materials.wire
                );
                wire.rotation.z = Math.PI / 2;
                wire.position.y = 0.3 + w * 0.25;
                wireGroup.add(wire);
            }

            // Barbs (small ticks)
            for (let b = 0; b < 12; b++) {
                const barb = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.003, 0.003, 0.04, 3),
                    this.materials.wire
                );
                barb.position.set(-1.3 + b * 0.24, 0.3 + (b % 3) * 0.25, 0);
                barb.rotation.z = Math.random() * Math.PI;
                wireGroup.add(barb);
            }

            this.placeRandomly(wireGroup, 22, 48);
            this.group.add(wireGroup);
        }
    }

    placeRandomly(obj, radiusMin, radiusMax) {
        const angle = Math.random() * Math.PI * 2;
        const dist = radiusMin + Math.random() * (radiusMax - radiusMin);
        
        obj.position.set(
            Math.cos(angle) * dist,
            obj.position.y || 0,
            Math.sin(angle) * dist
        );
        obj.rotation.y = Math.random() * Math.PI * 2;
        
        // Enable shadows on all meshes
        obj.traverse(c => {
            if (c.isMesh) {
                c.castShadow = true;
                c.receiveShadow = true;
            }
        });
    }
}

const decorations = new Decorations();
export default decorations;
