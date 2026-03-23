import * as THREE from 'three';

class Skybox {
    constructor() {
        this.mesh = this.createSkybox();
    }

    createSkybox() {
        // Large sphere to act as sky dome
        const geometry = new THREE.SphereGeometry(400, 32, 32);
        
        // Custom shader for gradient sky
        const vertexShader = `
            varying vec3 vWorldPosition;
            void main() {
                vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                vWorldPosition = worldPosition.xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;

        const fragmentShader = `
            uniform vec3 topColor;
            uniform vec3 bottomColor;
            uniform float offset;
            uniform float exponent;
            varying vec3 vWorldPosition;
            void main() {
                float h = normalize(vWorldPosition + offset).y;
                gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
            }
        `;

        const uniforms = {
            topColor: { value: new THREE.Color(0x0a0a2a) }, // Dark space purple/blue
            bottomColor: { value: new THREE.Color(0x020205) }, // Near pitch black at horizon
            offset: { value: 33 },
            exponent: { value: 0.6 }
        };

        const material = new THREE.ShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            uniforms: uniforms,
            side: THREE.BackSide,
            depthWrite: false
        });

        const sky = new THREE.Mesh(geometry, material);
        
        // Add subtle dots for stars/dust
        const starsGeo = new THREE.BufferGeometry();
        const starsCount = 1000;
        const posArray = new Float32Array(starsCount * 3);
        
        for(let i = 0; i < starsCount * 3; i++) {
            // Random position in a large sphere
            posArray[i] = (Math.random() - 0.5) * 600;
        }
        
        starsGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        const starsMat = new THREE.PointsMaterial({
            size: 0.5,
            color: 0x00f0ff,
            transparent: true,
            opacity: 0.5
        });
        
        const starsMesh = new THREE.Points(starsGeo, starsMat);
        sky.add(starsMesh);

        return sky;
    }
}

const skybox = new Skybox();
export default skybox;
