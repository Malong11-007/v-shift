import * as THREE from 'three';

class Decorations {
    constructor() {
        this.group = new THREE.Group();
        
        // Monochrome styling materials
        this.materials = {
            trunk: new THREE.MeshStandardMaterial({ color: 0x241a1a, roughness: 1.0 }),
            foliage: new THREE.MeshStandardMaterial({ color: 0x1a241a, roughness: 1.0, flatShading: true }),
            rock: new THREE.MeshStandardMaterial({ color: 0x1a1a24, roughness: 0.9, flatShading: true })
        };
    }

    async init() {
        // We no longer use external models. Creating procedural decorations.
        this.createProceduralTrees(20);
        this.createProceduralRocks(15);
    }
    
    createProceduralTrees(count) {
        for (let i = 0; i < count; i++) {
            const tree = new THREE.Group();
            
            // Trunk
            const trunk = new THREE.Mesh(new THREE.BoxGeometry(0.5, 3, 0.5), this.materials.trunk);
            trunk.position.y = 1.5;
            tree.add(trunk);
            
            // Foliage (Cones for pine look)
            for (let j = 0; j < 3; j++) {
                const foliage = new THREE.Mesh(
                    new THREE.ConeGeometry(2 - j * 0.5, 2, 6),
                    this.materials.foliage
                );
                foliage.position.y = 2.5 + j * 1.5;
                tree.add(foliage);
            }
            
            this.placeRandomly(tree, 35, 70);
            this.group.add(tree);
        }
    }

    createProceduralRocks(count) {
        for (let i = 0; i < count; i++) {
            const rock = new THREE.Mesh(
                new THREE.DodecahedronGeometry(1 + Math.random() * 2, 0),
                this.materials.rock
            );
            rock.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
            rock.scale.y *= 0.6; // Flattened
            
            this.placeRandomly(rock, 25, 60);
            this.group.add(rock);
        }
    }

    placeRandomly(obj, radiusMin, radiusMax) {
        const angle = Math.random() * Math.PI * 2;
        const dist = radiusMin + Math.random() * (radiusMax - radiusMin);
        
        obj.position.set(
            Math.cos(angle) * dist,
            0, 
            Math.sin(angle) * dist
        );
        obj.rotation.y = Math.random() * Math.PI * 2;
        obj.castShadow = true;
        obj.receiveShadow = true;
    }
}

const decorations = new Decorations();
export default decorations;
