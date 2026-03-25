import * as THREE from 'three';

class Skybox {
    constructor() {
        this.mesh = this.createSkybox();
    }

    createSkybox() {
        // Large sphere sky dome (higher poly for smoother gradient)
        const geometry = new THREE.SphereGeometry(400, 48, 48);
        
        // Enhanced gradient shader with nebula color patches
        const vertexShader = `
            varying vec3 vWorldPosition;
            varying vec3 vPosition;
            void main() {
                vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                vWorldPosition = worldPosition.xyz;
                vPosition = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;

        const fragmentShader = `
            uniform vec3 topColor;
            uniform vec3 bottomColor;
            uniform vec3 nebulaColor1;
            uniform vec3 nebulaColor2;
            uniform float offset;
            uniform float exponent;
            uniform float time;
            varying vec3 vWorldPosition;
            varying vec3 vPosition;

            // Simple hash for procedural noise
            float hash(vec2 p) {
                return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
            }

            void main() {
                float h = normalize(vWorldPosition + offset).y;
                vec3 baseColor = mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0));

                // Nebula patches (subtle colored regions)
                float n1 = hash(floor(vPosition.xz * 0.01)) * 0.5;
                float n2 = hash(floor(vPosition.xz * 0.015 + 5.0)) * 0.3;
                vec3 nebula = nebulaColor1 * n1 * max(h, 0.0) + nebulaColor2 * n2 * max(h - 0.3, 0.0);

                gl_FragColor = vec4(baseColor + nebula * 0.15, 1.0);
            }
        `;

        const uniforms = {
            topColor: { value: new THREE.Color(0x0c0c30) },
            bottomColor: { value: new THREE.Color(0x030308) },
            nebulaColor1: { value: new THREE.Color(0x220044) },  // Purple nebula
            nebulaColor2: { value: new THREE.Color(0x002244) },  // Blue nebula
            offset: { value: 33 },
            exponent: { value: 0.55 },
            time: { value: 0 }
        };

        const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms,
            side: THREE.BackSide,
            depthWrite: false
        });

        const sky = new THREE.Mesh(geometry, material);

        // Enhanced star field
        this.addStarField(sky, 1500, 0.4, 0x88ccff, 0.6);   // Bright blue-white stars
        this.addStarField(sky, 500, 0.8, 0xffffff, 0.9);     // Bright white highlights
        this.addStarField(sky, 300, 0.3, 0xff8844, 0.4);     // Warm reddish stars
        
        // Dust particles (atmospheric floating particles)
        this.addDustParticles(sky, 400);

        return sky;
    }

    addStarField(parent, count, size, color, opacity) {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        
        for (let i = 0; i < count; i++) {
            // Distribute in upper hemisphere primarily
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI * 0.7; // Bias towards top
            const r = 280 + Math.random() * 100;
            
            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.cos(phi);
            positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
            
            sizes[i] = size * (0.5 + Math.random() * 1.0);
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            size,
            color,
            transparent: true,
            opacity,
            sizeAttenuation: true,
            depthWrite: false
        });
        
        parent.add(new THREE.Points(geometry, material));
    }

    addDustParticles(parent, count) {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        
        for (let i = 0; i < count; i++) {
            // Near-field dust floating in the air
            positions[i * 3] = (Math.random() - 0.5) * 200;
            positions[i * 3 + 1] = Math.random() * 30 + 2;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            size: 0.15,
            color: 0x667788,
            transparent: true,
            opacity: 0.2,
            sizeAttenuation: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        parent.add(new THREE.Points(geometry, material));
    }
}

const skybox = new Skybox();
export default skybox;
