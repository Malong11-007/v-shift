import * as THREE from 'three';

class WeaponFactory {
    static createWeapon(id) {
        switch(id.toUpperCase()) {
            case 'V44SABRE': return this.createV44Sabre();
            case 'CINCH9': return this.createCinch9();
            case 'BREACH12': return this.createBreach12();
            case 'BOLT88': return this.createBolt88();
            case 'SIDEARM': return this.createSidearm();
            case 'KNIFE': return this.createKnife();
            default: return this.createV44Sabre();
        }
    }

    static createV44Sabre() {
        const group = new THREE.Group();
        const metal = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.2 });
        const tan = new THREE.MeshStandardMaterial({ color: 0x8b7d6b, roughness: 0.8 }); // Tactical Tan
        
        // Receiver
        const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.09, 0.28), tan);
        group.add(receiver);
        
        // Detailed Barrel
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.4), metal);
        barrel.rotation.x = Math.PI/2;
        barrel.position.z = 0.34;
        group.add(barrel);
        
        const flashHider = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.05), metal);
        flashHider.rotation.x = Math.PI/2;
        flashHider.position.z = 0.54;
        group.add(flashHider);

        // Handguard
        const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.07, 0.22), tan);
        handguard.position.z = 0.2;
        group.add(handguard);

        // Stock (Modern adjustable style)
        const bufferTube = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.15), metal);
        bufferTube.rotation.x = Math.PI/2;
        bufferTube.position.z = -0.21;
        group.add(bufferTube);
        
        const stock = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.12, 0.18), tan);
        stock.position.set(0, -0.02, -0.28);
        group.add(stock);

        // Mag (Curved)
        const mag = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.15, 0.07), metal);
        mag.position.set(0, -0.12, 0.08);
        mag.rotation.x = -0.2;
        group.add(mag);

        // Optic (Red Dot)
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.01, 0.2), metal);
        rail.position.y = 0.05;
        group.add(rail);
        
        const redDot = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.08), metal);
        redDot.position.set(0, 0.08, 0.05);
        group.add(redDot);

        group.userData.muzzlePos = new THREE.Vector3(0, 0.02, 0.55);
        group.userData.gripData = {
            rightHand: { pos: new THREE.Vector3(0, -0.08, -0.05) },
            leftHand: { pos: new THREE.Vector3(0, -0.05, 0.2) }
        };
        return group;
    }

    static createCinch9() {
        const group = new THREE.Group();
        const metal = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.6 });
        const orange = new THREE.MeshStandardMaterial({ color: 0xff5500 }); // Accents
        
        // Compact Receiver
        const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 0.22), metal);
        group.add(receiver);
        
        // Short Barrel with integrated suppressor look
        const suppressor = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.18), metal);
        suppressor.rotation.x = Math.PI/2;
        suppressor.position.z = 0.2;
        group.add(suppressor);

        // Top Rail
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.01, 0.15), orange);
        rail.position.y = 0.045;
        group.add(rail);

        // Vertical Grip
        const vGrip = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.08), metal);
        vGrip.position.set(0, -0.08, 0.1);
        group.add(vGrip);

        // Extended Mag
        const mag = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.2, 0.03), metal);
        mag.position.set(0, -0.14, 0.02);
        group.add(mag);

        group.userData.muzzlePos = new THREE.Vector3(0, 0, 0.28);
        group.userData.gripData = {
            rightHand: { pos: new THREE.Vector3(0, -0.08, -0.02) },
            leftHand: { pos: new THREE.Vector3(0, -0.08, 0.1) }
        };
        return group;
    }

    static createBreach12() {
        const group = new THREE.Group();
        const metal = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.4 });
        const wood = new THREE.MeshStandardMaterial({ color: 0x3d2b1f });
        
        // Heavy Receiver
        const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.35), metal);
        group.add(receiver);
        
        // Double Barrel
        const barrel1 = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.55), metal);
        barrel1.rotation.x = Math.PI/2;
        barrel1.position.set(-0.02, 0.01, 0.45);
        group.add(barrel1);

        const barrel2 = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.55), metal);
        barrel2.rotation.x = Math.PI/2;
        barrel2.position.set(0.02, 0.01, 0.45);
        group.add(barrel2);

        // Pump handle
        const pump = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.06, 0.2), wood);
        pump.position.set(0, -0.04, 0.25);
        group.add(pump);

        // Fixed Stock
        const stock = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.1, 0.35), wood);
        stock.position.z = -0.35;
        group.add(stock);

        group.userData.muzzlePos = new THREE.Vector3(0, 0.01, 0.72);
        group.userData.gripData = {
            rightHand: { pos: new THREE.Vector3(0, -0.06, -0.15) },
            leftHand: { pos: new THREE.Vector3(0, -0.04, 0.25) }
        };
        return group;
    }

    static createBolt88() {
        const group = new THREE.Group();
        const metal = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0.9 });
        const olive = new THREE.MeshStandardMaterial({ color: 0x3b4230 }); // Olive Drab
        
        // Massive Receiver
        const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.1, 0.45), olive);
        group.add(receiver);
        
        // Long fluted barrel
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.8), metal);
        barrel.rotation.x = Math.PI/2;
        barrel.position.z = 0.6;
        group.add(barrel);
        
        const muzzleBrake = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.1), metal);
        muzzleBrake.position.z = 1.0;
        group.add(muzzleBrake);

        // Large Scope
        const scopeMount = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.04, 0.05), metal);
        scopeMount.position.set(0, 0.07, 0.1);
        group.add(scopeMount);
        
        const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.3), metal);
        scope.rotation.x = Math.PI/2;
        scope.position.set(0, 0.12, 0.1);
        group.add(scope);

        // Thumbhole Stock
        const stock = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.15, 0.4), olive);
        stock.position.z = -0.4;
        group.add(stock);

        group.userData.muzzlePos = new THREE.Vector3(0, 0, 1.05);
        group.userData.gripData = {
            rightHand: { pos: new THREE.Vector3(0, -0.05, -0.15) },
            leftHand: { pos: new THREE.Vector3(0, -0.02, 0.3) }
        };
        return group;
    }

    static createSidearm() {
        const group = new THREE.Group();
        const steel = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.9, roughness: 0.1 });
        const black = new THREE.MeshStandardMaterial({ color: 0x111111 });

        // Slide (Two-tone)
        const slide = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.045, 0.2), steel);
        slide.position.y = 0.02;
        group.add(slide);
        
        const frame = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.04, 0.15), black);
        group.add(frame);

        // Grip
        const grip = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.1, 0.04), black);
        grip.position.set(0, -0.06, -0.04);
        grip.rotation.x = 0.25;
        group.add(grip);

        group.userData.muzzlePos = new THREE.Vector3(0, 0.02, 0.1);
        group.userData.gripData = {
            rightHand: { pos: new THREE.Vector3(0, -0.06, -0.04) },
            leftHand: null // Single handed
        };
        return group;
    }

    static createKnife() {
        const group = new THREE.Group();
        const chrome = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1.0, roughness: 0.0 });
        const carbon = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });

        // Tanto Blade
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.04, 0.22), chrome);
        blade.position.z = 0.12;
        group.add(blade);
        
        // Serrations (simplified geometry)
        const serrations = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.015, 0.1), carbon);
        serrations.position.set(0, -0.02, 0.08);
        group.add(serrations);

        // Handle
        const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.12), carbon);
        handle.rotation.x = Math.PI/2;
        handle.position.z = -0.06;
        group.add(handle);

        group.userData.gripData = {
            rightHand: { pos: new THREE.Vector3(0, -0.015, -0.06) },
            leftHand: null // Single handed
        };
        return group;
    }
}

export default WeaponFactory;
