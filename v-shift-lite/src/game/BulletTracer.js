import * as THREE from 'three';
import engine from '../core/Engine.js';

/**
 * Visual bullet tracer — thin line from gun to hit point, fades quickly.
 */
export default class BulletTracer {
    static create(origin, hitPoint, color = 0xffcc44) {
        const dir = hitPoint.clone().sub(origin);
        const length = dir.length();
        
        if (length < 0.5) return; // Too close to bother
        
        // Create line geometry
        const geometry = new THREE.BufferGeometry().setFromPoints([
            origin.clone(),
            hitPoint.clone()
        ]);
        
        const material = new THREE.LineBasicMaterial({
            color,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            linewidth: 2
        });
        
        const line = new THREE.Line(geometry, material);
        engine.scene.add(line);
        
        // Fade and remove
        let life = 0.1;
        const updater = {
            update: (dt) => {
                life -= dt;
                material.opacity = Math.max(0, life / 0.1) * 0.8;
                
                if (life <= 0) {
                    engine.scene.remove(line);
                    geometry.dispose();
                    material.dispose();
                    const idx = engine.updatables.indexOf(updater);
                    if (idx !== -1) engine.updatables.splice(idx, 1);
                }
            }
        };
        engine.updatables.push(updater);
    }
}
