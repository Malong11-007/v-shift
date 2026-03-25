import * as THREE from 'three';

const CYLINDER_SEGMENTS = 12; // Higher segment count for smoother cylinders/capsules

class CharacterModel {
    constructor(teamColor = 0x3366aa) {
        this.root = new THREE.Group();
        this.root.name = "CharacterRoot";
        this.group = this.root; // For compatibility

        // ---- Materials (richer PBR) ----
        this.skinMat = new THREE.MeshStandardMaterial({ color: 0xd4a574, roughness: 0.75, metalness: 0.05 });
        this.clothesMat = new THREE.MeshStandardMaterial({ color: teamColor, roughness: 0.85, metalness: 0.1 });
        this.pantsMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.92 });
        this.bootMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.95, metalness: 0.15 });
        this.gloveMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.85, metalness: 0.1 });
        this.accentMat = new THREE.MeshStandardMaterial({
            color: 0x99e0ff, emissive: 0x224466, emissiveIntensity: 0.5, roughness: 0.3, metalness: 0.4
        });
        this.vestMat = new THREE.MeshStandardMaterial({ color: 0x2f3030, roughness: 0.95, metalness: 0.05 });
        this.helmetMat = new THREE.MeshStandardMaterial({ color: 0x1e1e1e, roughness: 0.6, metalness: 0.3 });
        this.visorMat = new THREE.MeshStandardMaterial({
            color: 0x00ccff, emissive: 0x006688, emissiveIntensity: 0.6,
            roughness: 0.1, metalness: 0.9, transparent: true, opacity: 0.8
        });
        this.beltMat = new THREE.MeshStandardMaterial({ color: 0x3d3022, roughness: 0.9 });
        this.pouchMat = new THREE.MeshStandardMaterial({ color: 0x363020, roughness: 0.95 });
        this.soleMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 1.0 });
        this.padMat = new THREE.MeshStandardMaterial({ color: 0x252525, roughness: 0.9, metalness: 0.05 });

        // ================================================
        // 1. HIPS (Root of skeleton)
        // ================================================
        this.hips = new THREE.Group();
        this.hips.position.y = 0.9;
        this.root.add(this.hips);

        const hipsMesh = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.16, 0.22), this.pantsMat);
        this.hips.add(hipsMesh);

        // Belt
        const belt = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.04, 0.24), this.beltMat);
        belt.position.y = 0.06;
        this.hips.add(belt);

        // Belt buckle
        const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.035, 0.01), this.accentMat);
        buckle.position.set(0, 0.06, 0.125);
        this.hips.add(buckle);

        // Side pouches on belt
        for (const side of [-1, 1]) {
            const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.07, 0.05), this.pouchMat);
            pouch.position.set(side * 0.17, 0.02, 0.06);
            this.hips.add(pouch);
            const pouchFlap = new THREE.Mesh(new THREE.BoxGeometry(0.062, 0.015, 0.052), this.beltMat);
            pouchFlap.position.set(side * 0.17, 0.06, 0.06);
            this.hips.add(pouchFlap);
        }

        // ================================================
        // 2. SPINE -> CHEST with tactical vest
        // ================================================
        this.spine = new THREE.Group();
        this.spine.position.y = 0.1;
        this.hips.add(this.spine);

        this.chest = new THREE.Group();
        this.chest.position.y = 0.25;
        this.spine.add(this.chest);

        // Base torso
        const chestMesh = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.32, 0.22), this.clothesMat);
        this.chest.add(chestMesh);

        // Tactical vest overlay (front plate)
        const vestFront = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.26, 0.04), this.vestMat);
        vestFront.position.set(0, -0.02, 0.13);
        this.chest.add(vestFront);

        // Vest back plate
        const vestBack = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.26, 0.03), this.vestMat);
        vestBack.position.set(0, -0.02, -0.12);
        this.chest.add(vestBack);

        // Vest side straps
        for (const side of [-1, 1]) {
            const strap = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.26, 0.1), this.vestMat);
            strap.position.set(side * 0.16, -0.02, 0.04);
            this.chest.add(strap);
        }

        // Armor plate inserts (front)
        const plateFront = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.2, 0.015), this.padMat);
        plateFront.position.set(0, 0.0, 0.155);
        this.chest.add(plateFront);

        // Magazine pouches on vest front
        for (let i = 0; i < 3; i++) {
            const magPouch = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 0.03), this.pouchMat);
            magPouch.position.set(-0.06 + i * 0.06, -0.1, 0.16);
            this.chest.add(magPouch);
        }

        // Accent stripe across chest
        const chestStripe = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.035, 0.24), this.accentMat);
        chestStripe.position.y = 0.12;
        this.chest.add(chestStripe);

        // Collar / neck guard
        const collar = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.06, 0.18), this.vestMat);
        collar.position.y = 0.19;
        this.chest.add(collar);

        // ================================================
        // 3. NECK -> HEAD with helmet & visor
        // ================================================
        this.neck = new THREE.Group();
        this.neck.position.y = 0.22;
        this.chest.add(this.neck);

        // Neck cylinder
        const neckMesh = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.06, 0.08, CYLINDER_SEGMENTS), this.skinMat
        );
        neckMesh.position.y = 0.02;
        this.neck.add(neckMesh);

        this.head = new THREE.Group();
        this.head.position.y = 0.1;
        this.neck.add(this.head);

        // Head base shape (slightly rounded with more detail)
        const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.24, 0.23), this.skinMat);
        this.head.add(headMesh);

        // Jaw definition
        const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.06, 0.18), this.skinMat);
        jaw.position.set(0, -0.12, 0.01);
        this.head.add(jaw);

        // Eyes (dark inset)
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2, metalness: 0.3 });
        for (const side of [-1, 1]) {
            const eye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), eyeMat);
            eye.position.set(side * 0.055, 0.03, 0.115);
            this.head.add(eye);
        }

        // Nose ridge
        const nose = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.05, 0.04), this.skinMat);
        nose.position.set(0, -0.01, 0.13);
        this.head.add(nose);

        // Tactical Helmet (covers top and sides of head)
        const helmet = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.16, 0.27), this.helmetMat);
        helmet.position.y = 0.1;
        this.head.add(helmet);

        // Helmet brim (front edge)
        const brim = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.03, 0.04), this.helmetMat);
        brim.position.set(0, 0.02, 0.14);
        this.head.add(brim);

        // Helmet ear covers
        for (const side of [-1, 1]) {
            const earCover = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.1, 0.12), this.helmetMat);
            earCover.position.set(side * 0.13, 0.05, -0.02);
            this.head.add(earCover);
        }

        // Helmet rail (NVG mount)
        const helmetRail = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.015, 0.02), this.padMat);
        helmetRail.position.set(0, 0.19, 0.06);
        this.head.add(helmetRail);

        // Visor (glowing tactical display)
        const visor = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.04, 0.02), this.visorMat);
        visor.position.set(0, 0.02, 0.135);
        this.head.add(visor);

        // Chin strap
        const chinStrap = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.08, 0.15), this.beltMat);
        chinStrap.position.set(0.1, -0.05, 0.0);
        this.head.add(chinStrap);

        // ================================================
        // 4. ARMS with shoulder pads & elbow guards
        // ================================================
        this._buildArm(1);   // Right
        this._buildArm(-1);  // Left

        // Weapon Mount on right hand
        this.weaponMount = new THREE.Group();
        this.weaponMount.position.set(0, -0.05, 0.05);
        this.handR.add(this.weaponMount);

        // ================================================
        // 5. LEGS with knee pads & detailed boots
        // ================================================
        this._buildLeg(1);   // Right
        this._buildLeg(-1);  // Left

        // ---- Finalize: enable shadow casting on all meshes ----
        this.root.traverse(c => {
            if (c.isMesh) {
                c.castShadow = true;
                c.receiveShadow = true;
                c.frustumCulled = false;
                if (c.material && c.material.userData) {
                    c.material.userData.initialEmissive = c.material.emissive ? c.material.emissive.clone() : new THREE.Color(0);
                }
            }
        });
    }

    // ---- Arm builder (side: 1=right, -1=left) ----
    _buildArm(side) {
        const prefix = side === 1 ? 'R' : 'L';

        // Shoulder joint
        const shoulder = new THREE.Group();
        shoulder.position.set(side * 0.22, 0.15, 0);
        this.chest.add(shoulder);
        this['shoulder' + prefix] = shoulder;

        // Shoulder pad
        const shoulderPad = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.1), this.vestMat);
        shoulderPad.position.set(side * 0.03, 0.02, 0);
        shoulder.add(shoulderPad);
        const padAccent = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.015, 0.08), this.accentMat);
        padAccent.position.set(side * 0.03, 0.05, 0);
        shoulder.add(padAccent);

        // Upper arm
        const upperArm = new THREE.Mesh(
            new THREE.CapsuleGeometry(0.055, 0.2, CYLINDER_SEGMENTS, CYLINDER_SEGMENTS), this.clothesMat
        );
        upperArm.position.y = -0.1;
        shoulder.add(upperArm);

        // Bicep band
        const bicepBand = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.02, CYLINDER_SEGMENTS), this.padMat);
        bicepBand.position.y = -0.04;
        shoulder.add(bicepBand);

        // Elbow joint
        const elbow = new THREE.Group();
        elbow.position.y = -0.2;
        shoulder.add(elbow);
        this['elbow' + prefix] = elbow;

        // Elbow guard
        const elbowGuard = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.05, 0.06), this.padMat);
        elbowGuard.position.set(side * 0.01, 0.0, -0.02);
        elbow.add(elbowGuard);

        // Forearm
        const forearm = new THREE.Mesh(
            new THREE.CapsuleGeometry(0.045, 0.18, CYLINDER_SEGMENTS, CYLINDER_SEGMENTS), this.skinMat
        );
        forearm.position.y = -0.1;
        elbow.add(forearm);

        // Wrist guard (sleeve cuff)
        const wristGuard = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.048, 0.03, CYLINDER_SEGMENTS), this.gloveMat);
        wristGuard.position.y = -0.18;
        elbow.add(wristGuard);

        // Hand
        const hand = new THREE.Group();
        hand.position.y = -0.2;
        elbow.add(hand);
        this['hand' + prefix] = hand;

        // Gloved hand with palm and fingers
        const palm = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.05), this.gloveMat);
        hand.add(palm);

        // Finger set (simplified block of 4 fingers)
        const fingers = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.04, 0.025), this.gloveMat);
        fingers.position.set(0, -0.02, 0.035);
        hand.add(fingers);

        // Thumb
        const thumb = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.04, 0.02), this.gloveMat);
        thumb.position.set(side * 0.035, -0.01, 0.01);
        hand.add(thumb);
    }

    // ---- Leg builder (side: 1=right, -1=left) ----
    _buildLeg(side) {
        const prefix = side === 1 ? 'R' : 'L';

        const leg = new THREE.Group();
        leg.position.set(side * 0.12, -0.05, 0);
        this.hips.add(leg);
        this['leg' + prefix] = leg;

        // Upper leg (thigh)
        const upperLeg = new THREE.Mesh(
            new THREE.CapsuleGeometry(0.075, 0.3, CYLINDER_SEGMENTS, CYLINDER_SEGMENTS), this.pantsMat
        );
        upperLeg.position.y = -0.15;
        leg.add(upperLeg);

        // Thigh pocket
        const thighPocket = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.07, 0.03), this.pouchMat);
        thighPocket.position.set(side * 0.06, -0.12, 0.0);
        leg.add(thighPocket);

        // Thigh strap
        const thighStrap = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.08, 0.02, CYLINDER_SEGMENTS), this.beltMat
        );
        thighStrap.position.y = -0.08;
        leg.add(thighStrap);

        // Knee joint
        const knee = new THREE.Group();
        knee.position.y = -0.3;
        leg.add(knee);
        this['knee' + prefix] = knee;

        // Knee pad
        const kneePad = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.06), this.padMat);
        kneePad.position.set(0, 0.0, 0.04);
        knee.add(kneePad);
        const kneePadCenter = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.02, 8), this.accentMat);
        kneePadCenter.rotation.x = Math.PI / 2;
        kneePadCenter.position.set(0, 0.0, 0.075);
        knee.add(kneePadCenter);

        // Lower leg (shin)
        const lowerLeg = new THREE.Mesh(
            new THREE.CapsuleGeometry(0.065, 0.3, CYLINDER_SEGMENTS, CYLINDER_SEGMENTS), this.pantsMat
        );
        lowerLeg.position.y = -0.15;
        knee.add(lowerLeg);

        // Ankle band
        const ankleBand = new THREE.Mesh(
            new THREE.CylinderGeometry(0.07, 0.07, 0.025, CYLINDER_SEGMENTS), this.bootMat
        );
        ankleBand.position.y = -0.28;
        knee.add(ankleBand);

        // Foot
        const foot = new THREE.Group();
        foot.position.y = -0.3;
        knee.add(foot);
        this['foot' + prefix] = foot;

        // Boot upper
        const bootUpper = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.1, 0.16), this.bootMat);
        bootUpper.position.set(0, 0.0, 0.02);
        foot.add(bootUpper);

        // Boot toe cap (reinforced)
        const toeCap = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.04), this.padMat);
        toeCap.position.set(0, -0.02, 0.1);
        foot.add(toeCap);

        // Boot sole
        const sole = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.025, 0.2), this.soleMat);
        sole.position.set(0, -0.05, 0.04);
        foot.add(sole);

        // Sole treads (grip pattern)
        for (let i = 0; i < 4; i++) {
            const tread = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.006, 0.015), this.padMat);
            tread.position.set(0, -0.065, -0.04 + i * 0.04);
            foot.add(tread);
        }

        // Boot lace detail
        for (let i = 0; i < 3; i++) {
            const lace = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.008, 0.005), this.beltMat);
            lace.position.set(0, 0.02 + i * 0.025, 0.085);
            foot.add(lace);
        }
    }
}

export default CharacterModel;
