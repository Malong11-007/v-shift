import * as THREE from 'three';

class CharacterModel {
    constructor(teamColor = 0x3366aa) {
        this.root = new THREE.Group();
        this.root.name = "CharacterRoot";
        this.group = this.root; // For compatibility
        
        // Materials
        this.skinMat = new THREE.MeshStandardMaterial({ color: 0xd4a574, roughness: 0.8 });
        this.clothesMat = new THREE.MeshStandardMaterial({ color: teamColor, roughness: 0.9 });
        this.pantsMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.9 });
        this.bootMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
        this.gloveMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
        
        // 1. Hips (Root of skeleton)
        this.hips = new THREE.Group();
        this.hips.position.y = 0.9;
        this.root.add(this.hips);
        
        const hipsMesh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.2), this.pantsMat);
        this.hips.add(hipsMesh);
        
        // 2. Spine -> Chest
        this.spine = new THREE.Group();
        this.spine.position.y = 0.1;
        this.hips.add(this.spine);
        
        this.chest = new THREE.Group();
        this.chest.position.y = 0.25;
        this.spine.add(this.chest);
        
        const chestMesh = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.3, 0.2), this.clothesMat);
        this.chest.add(chestMesh);
        
        // 3. Neck -> Head
        this.neck = new THREE.Group();
        this.neck.position.y = 0.2;
        this.chest.add(this.neck);
        
        this.head = new THREE.Group();
        this.head.position.y = 0.1;
        this.neck.add(this.head);
        
        const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.25, 0.22), this.skinMat);
        this.head.add(headMesh);
        
        // 4. Arms
        this.shoulderR = new THREE.Group();
        this.shoulderR.position.set(0.22, 0.15, 0);
        this.chest.add(this.shoulderR);
        
        const upperArmR = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.2), this.clothesMat);
        upperArmR.position.y = -0.1;
        this.shoulderR.add(upperArmR);
        
        this.elbowR = new THREE.Group();
        this.elbowR.position.y = -0.2;
        this.shoulderR.add(this.elbowR);
        
        const forearmR = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.18), this.skinMat);
        forearmR.position.y = -0.1;
        this.elbowR.add(forearmR);
        
        this.handR = new THREE.Group();
        this.handR.position.y = -0.2;
        this.elbowR.add(this.handR);
        
        const handRMesh = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.04), this.gloveMat);
        this.handR.add(handRMesh);
        
        // Weapon Mount
        this.weaponMount = new THREE.Group();
        this.weaponMount.position.set(0, -0.05, 0.05); // Adjust based on weapon grip
        this.handR.add(this.weaponMount);
        
        // Left Arm
        this.shoulderL = new THREE.Group();
        this.shoulderL.position.set(-0.22, 0.15, 0);
        this.chest.add(this.shoulderL);
        
        const upperArmL = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.2), this.clothesMat);
        upperArmL.position.y = -0.1;
        this.shoulderL.add(upperArmL);
        
        this.elbowL = new THREE.Group();
        this.elbowL.position.y = -0.2;
        this.shoulderL.add(this.elbowL);
        
        const forearmL = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.18), this.skinMat);
        forearmL.position.y = -0.1;
        this.elbowL.add(forearmL);
        
        this.handL = new THREE.Group();
        this.handL.position.y = -0.2;
        this.elbowL.add(this.handL);
        
        const handLMesh = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.04), this.gloveMat);
        this.handL.add(handLMesh);
        
        // 5. Legs
        this.legR = new THREE.Group();
        this.legR.position.set(0.12, -0.05, 0);
        this.hips.add(this.legR);
        
        const upperLegR = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.3), this.pantsMat);
        upperLegR.position.y = -0.15;
        this.legR.add(upperLegR);
        
        this.kneeR = new THREE.Group();
        this.kneeR.position.y = -0.3;
        this.legR.add(this.kneeR);
        
        const lowerLegR = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.3), this.pantsMat);
        lowerLegR.position.y = -0.15;
        this.kneeR.add(lowerLegR);
        
        this.footR = new THREE.Group();
        this.footR.position.y = -0.3;
        this.kneeR.add(this.footR);
        
        const footRMesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.18), this.bootMat);
        footRMesh.position.z = 0.05;
        this.footR.add(footRMesh);
        
        // Left Leg
        this.legL = new THREE.Group();
        this.legL.position.set(-0.12, -0.05, 0);
        this.hips.add(this.legL);
        
        const upperLegL = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.3), this.pantsMat);
        upperLegL.position.y = -0.15;
        this.legL.add(upperLegL);
        
        this.kneeL = new THREE.Group();
        this.kneeL.position.y = -0.3;
        this.legL.add(this.kneeL);
        
        const lowerLegL = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.3), this.pantsMat);
        lowerLegL.position.y = -0.15;
        this.kneeL.add(lowerLegL);
        
        this.footL = new THREE.Group();
        this.footL.position.y = -0.3;
        this.kneeL.add(this.footL);
        
        const footLMesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.18), this.bootMat);
        footLMesh.position.z = 0.05;
        this.footL.add(footLMesh);
        
        // Ensure shadow casting
        this.root.traverse(c => {
            if (c.isMesh) {
                c.castShadow = true;
                c.receiveShadow = true;
                c.frustumCulled = false;
            }
        });
    }
}

export default CharacterModel;
