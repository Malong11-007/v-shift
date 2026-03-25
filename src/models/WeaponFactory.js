import * as THREE from 'three';

const CYLINDER_SEGMENTS = 16; // Higher segment count for smooth cylinders

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

    // ---- Shared material helpers ----
    static _metalDark()  { return new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.85, roughness: 0.18 }); }
    static _metalMid()   { return new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.2 }); }
    static _metalLight() { return new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.9, roughness: 0.12 }); }
    static _tan()        { return new THREE.MeshStandardMaterial({ color: 0x8b7d6b, roughness: 0.8, metalness: 0.05 }); }
    static _wood()       { return new THREE.MeshStandardMaterial({ color: 0x3d2b1f, roughness: 0.92, metalness: 0.02 }); }
    static _olive()      { return new THREE.MeshStandardMaterial({ color: 0x3b4230, roughness: 0.85, metalness: 0.05 }); }
    static _rubber()     { return new THREE.MeshStandardMaterial({ color: 0x0f0f0f, roughness: 0.95 }); }
    static _chrome()     { return new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 1.0, roughness: 0.05 }); }
    static _lens()       { return new THREE.MeshStandardMaterial({ color: 0x00ccff, emissive: 0x004488, emissiveIntensity: 0.8, roughness: 0.05, metalness: 0.9, transparent: true, opacity: 0.7 }); }
    static _orange()     { return new THREE.MeshStandardMaterial({ color: 0xff5500, emissive: 0x331100, emissiveIntensity: 0.3, roughness: 0.5 }); }

    // ========================================================
    // V44 SABRE — Tactical Assault Rifle
    // ========================================================
    static createV44Sabre() {
        const group = new THREE.Group();
        const metal = this._metalMid();
        const tan = this._tan();
        const dark = this._metalDark();
        const rubber = this._rubber();

        // --- Receiver body ---
        const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.09, 0.28), tan);
        group.add(receiver);

        // Receiver detail lines (bolt catch, safety selector)
        const boltCatch = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.02, 0.015), dark);
        boltCatch.position.set(0.033, -0.01, 0.05);
        group.add(boltCatch);
        const selector = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.005, 8), dark);
        selector.rotation.z = Math.PI / 2;
        selector.position.set(0.033, 0.0, -0.02);
        group.add(selector);

        // Ejection port
        const ejectionPort = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.03, 0.04), dark);
        ejectionPort.position.set(0.033, 0.015, 0.06);
        group.add(ejectionPort);

        // --- Barrel (multi-part) ---
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.4, CYLINDER_SEGMENTS), metal);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.z = 0.34;
        group.add(barrel);

        // Barrel shroud / gas tube
        const gasTube = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.25, 8), dark);
        gasTube.rotation.x = Math.PI / 2;
        gasTube.position.set(0, 0.025, 0.26);
        group.add(gasTube);

        // Gas block (front sight mount)
        const gasBlock = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, 0.02), dark);
        gasBlock.position.set(0, 0.025, 0.39);
        group.add(gasBlock);

        // Front sight post
        const frontSight = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.035, 0.003), dark);
        frontSight.position.set(0, 0.045, 0.39);
        group.add(frontSight);

        // Flash hider (multi-prong)
        const flashBase = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.018, 0.04, CYLINDER_SEGMENTS), metal);
        flashBase.rotation.x = Math.PI / 2;
        flashBase.position.z = 0.55;
        group.add(flashBase);
        for (let i = 0; i < 4; i++) {
            const prong = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.03, 6), metal);
            prong.rotation.x = Math.PI / 2;
            const angle = (i / 4) * Math.PI * 2;
            prong.position.set(Math.cos(angle) * 0.012, Math.sin(angle) * 0.012, 0.57);
            group.add(prong);
        }

        // --- Handguard with rail system ---
        const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.065, 0.22), tan);
        handguard.position.z = 0.2;
        group.add(handguard);

        // Top Picatinny rail
        const topRail = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.008, 0.22), dark);
        topRail.position.set(0, 0.04, 0.2);
        group.add(topRail);
        // Rail teeth
        for (let i = 0; i < 8; i++) {
            const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.004, 0.006), dark);
            tooth.position.set(0, 0.046, 0.1 + i * 0.025);
            group.add(tooth);
        }

        // Bottom rail
        const bottomRail = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.008, 0.14), dark);
        bottomRail.position.set(0, -0.04, 0.22);
        group.add(bottomRail);

        // Side rails
        for (const side of [-1, 1]) {
            const sideRail = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.03, 0.1), dark);
            sideRail.position.set(side * 0.032, 0.0, 0.22);
            group.add(sideRail);
        }

        // Handguard ventilation holes
        for (let i = 0; i < 3; i++) {
            for (const side of [-1, 1]) {
                const vent = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.015, 0.025), dark);
                vent.position.set(side * 0.03, -0.015, 0.13 + i * 0.06);
                group.add(vent);
            }
        }

        // --- Trigger guard & trigger ---
        const triggerGuard = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.004, 6, CYLINDER_SEGMENTS, Math.PI), dark);
        triggerGuard.rotation.y = Math.PI / 2;
        triggerGuard.position.set(0, -0.06, -0.01);
        group.add(triggerGuard);

        const trigger = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.025, 0.01), metal);
        trigger.position.set(0, -0.055, -0.005);
        trigger.rotation.x = -0.3;
        group.add(trigger);

        // --- Pistol grip ---
        const grip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.1, 0.04), rubber);
        grip.position.set(0, -0.1, -0.06);
        grip.rotation.x = 0.2;
        group.add(grip);

        // Grip texture lines
        for (let i = 0; i < 4; i++) {
            const gripLine = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.003, 0.005), dark);
            gripLine.position.set(0, -0.07 - i * 0.015, -0.06);
            gripLine.rotation.x = 0.2;
            group.add(gripLine);
        }

        // --- Stock (Adjustable) ---
        const bufferTube = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.15, CYLINDER_SEGMENTS), metal);
        bufferTube.rotation.x = Math.PI / 2;
        bufferTube.position.z = -0.21;
        group.add(bufferTube);

        const stock = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.1, 0.16), tan);
        stock.position.set(0, -0.01, -0.28);
        group.add(stock);

        // Stock butt pad
        const buttPad = new THREE.Mesh(new THREE.BoxGeometry(0.047, 0.08, 0.012), rubber);
        buttPad.position.set(0, -0.01, -0.365);
        group.add(buttPad);

        // Stock adjustment lever
        const stockLever = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.015, 0.02), dark);
        stockLever.position.set(0, -0.04, -0.22);
        group.add(stockLever);

        // --- Magazine (Curved STANAG) ---
        const mag = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.14, 0.065), dark);
        mag.position.set(0, -0.12, 0.08);
        mag.rotation.x = -0.2;
        group.add(mag);

        // Mag floor plate
        const magFloor = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.008, 0.066), metal);
        magFloor.position.set(0, -0.19, 0.06);
        magFloor.rotation.x = -0.2;
        group.add(magFloor);

        // Mag release button
        const magRelease = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.015, 0.012), metal);
        magRelease.position.set(0.033, -0.04, 0.08);
        group.add(magRelease);

        // --- Optic (Red Dot Sight) ---
        const opticBase = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.025, 0.06), dark);
        opticBase.position.set(0, 0.06, 0.04);
        group.add(opticBase);

        const opticHousing = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.06), dark);
        opticHousing.position.set(0, 0.085, 0.04);
        group.add(opticHousing);

        // Optic lens (glowing)
        const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.003, CYLINDER_SEGMENTS), this._lens());
        lens.rotation.x = Math.PI / 2;
        lens.position.set(0, 0.085, 0.072);
        group.add(lens);

        // Rear lens
        const rearLens = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.003, CYLINDER_SEGMENTS), this._lens());
        rearLens.rotation.x = Math.PI / 2;
        rearLens.position.set(0, 0.085, 0.008);
        group.add(rearLens);

        // Charging handle
        const chargingHandle = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.008, 0.02), metal);
        chargingHandle.position.set(0, 0.05, -0.1);
        group.add(chargingHandle);

        // Forward assist
        const forwardAssist = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.01, 8), metal);
        forwardAssist.rotation.z = Math.PI / 2;
        forwardAssist.position.set(0.036, 0.01, 0.0);
        group.add(forwardAssist);

        // Sling mount (rear)
        const slingMountRear = new THREE.Mesh(new THREE.TorusGeometry(0.008, 0.002, 4, 8, Math.PI), metal);
        slingMountRear.position.set(0, -0.05, -0.14);
        slingMountRear.rotation.x = Math.PI / 2;
        group.add(slingMountRear);

        group.userData.muzzlePos = new THREE.Vector3(0, 0.02, 0.58);
        group.userData.gripData = {
            rightHand: { pos: new THREE.Vector3(0, -0.08, -0.05) },
            leftHand: { pos: new THREE.Vector3(0, -0.05, 0.2) }
        };
        return group;
    }

    // ========================================================
    // CINCH9 — Compact SMG with suppressor
    // ========================================================
    static createCinch9() {
        const group = new THREE.Group();
        const metal = this._metalDark();
        const orange = this._orange();
        const dark = this._metalDark();
        const rubber = this._rubber();

        // Compact Receiver
        const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 0.22), metal);
        group.add(receiver);

        // Ejection port
        const ejPort = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.02, 0.03), this._metalMid());
        ejPort.position.set(0.027, 0.015, 0.04);
        group.add(ejPort);

        // Charging handle (side)
        const chHandle = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.008, 0.02), this._metalMid());
        chHandle.position.set(-0.03, 0.02, 0.02);
        group.add(chHandle);

        // Suppressor (integrated, multi-segment)
        const suppBase = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.06, CYLINDER_SEGMENTS), metal);
        suppBase.rotation.x = Math.PI / 2;
        suppBase.position.z = 0.14;
        group.add(suppBase);

        const suppMain = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.12, CYLINDER_SEGMENTS), metal);
        suppMain.rotation.x = Math.PI / 2;
        suppMain.position.z = 0.24;
        group.add(suppMain);

        const suppTip = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.02, 0.04, CYLINDER_SEGMENTS), metal);
        suppTip.rotation.x = Math.PI / 2;
        suppTip.position.z = 0.32;
        group.add(suppTip);

        // Suppressor rings (detail)
        for (let i = 0; i < 3; i++) {
            const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.005, CYLINDER_SEGMENTS), this._metalMid());
            ring.rotation.x = Math.PI / 2;
            ring.position.z = 0.19 + i * 0.04;
            group.add(ring);
        }

        // Top Rail with orange accent
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.008, 0.15), orange);
        rail.position.y = 0.045;
        group.add(rail);
        // Rail teeth
        for (let i = 0; i < 5; i++) {
            const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.004, 0.006), dark);
            tooth.position.set(0, 0.05, -0.04 + i * 0.03);
            group.add(tooth);
        }

        // Trigger guard
        const triggerGuard = new THREE.Mesh(new THREE.TorusGeometry(0.015, 0.003, 6, CYLINDER_SEGMENTS, Math.PI), dark);
        triggerGuard.rotation.y = Math.PI / 2;
        triggerGuard.position.set(0, -0.05, 0.01);
        group.add(triggerGuard);

        // Trigger
        const trigger = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.02, 0.008), this._metalMid());
        trigger.position.set(0, -0.045, 0.015);
        trigger.rotation.x = -0.3;
        group.add(trigger);

        // Pistol grip (ergonomic)
        const grip = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.09, 0.035), rubber);
        grip.position.set(0, -0.09, -0.03);
        grip.rotation.x = 0.25;
        group.add(grip);

        // Vertical Grip (fore-grip)
        const vGrip = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.015, 0.08, CYLINDER_SEGMENTS), rubber);
        vGrip.position.set(0, -0.08, 0.1);
        group.add(vGrip);
        const vGripBase = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.015, 0.025), dark);
        vGripBase.position.set(0, -0.04, 0.1);
        group.add(vGripBase);

        // Folding stock (wire frame style)
        const stockArm1 = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.15, 6), this._metalMid());
        stockArm1.rotation.x = Math.PI / 2;
        stockArm1.position.set(0.015, 0.015, -0.18);
        group.add(stockArm1);
        const stockArm2 = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.15, 6), this._metalMid());
        stockArm2.rotation.x = Math.PI / 2;
        stockArm2.position.set(-0.015, 0.015, -0.18);
        group.add(stockArm2);
        const stockPad = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 0.012), rubber);
        stockPad.position.set(0, 0.015, -0.26);
        group.add(stockPad);

        // Extended Mag
        const mag = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.18, 0.028), metal);
        mag.position.set(0, -0.13, 0.02);
        group.add(mag);
        const magFloor = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.008, 0.03), this._metalMid());
        magFloor.position.set(0, -0.22, 0.02);
        group.add(magFloor);

        // Orange accent stripe on receiver
        const accentStripe = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.005, 0.06), orange);
        accentStripe.position.set(0, -0.04, 0.08);
        group.add(accentStripe);

        group.userData.muzzlePos = new THREE.Vector3(0, 0, 0.34);
        group.userData.gripData = {
            rightHand: { pos: new THREE.Vector3(0, -0.08, -0.02) },
            leftHand: { pos: new THREE.Vector3(0, -0.08, 0.1) }
        };
        return group;
    }

    // ========================================================
    // BREACH12 — Tactical Shotgun (double-barrel pump)
    // ========================================================
    static createBreach12() {
        const group = new THREE.Group();
        const metal = this._metalDark();
        const wood = this._wood();
        const dark = this._metalDark();
        const rubber = this._rubber();

        // Heavy Receiver
        const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.11, 0.35), metal);
        group.add(receiver);

        // Receiver side plates
        for (const side of [-1, 1]) {
            const plate = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.08, 0.2), this._metalMid());
            plate.position.set(side * 0.043, 0, 0.05);
            group.add(plate);
        }

        // Loading port (bottom detail)
        const loadPort = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.005, 0.08), this._metalMid());
        loadPort.position.set(0, -0.058, 0.0);
        group.add(loadPort);

        // Double Barrel
        for (const offset of [-0.02, 0.02]) {
            const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.55, CYLINDER_SEGMENTS), metal);
            barrel.rotation.x = Math.PI / 2;
            barrel.position.set(offset, 0.01, 0.45);
            group.add(barrel);

            // Barrel collar
            const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.02, CYLINDER_SEGMENTS), this._metalMid());
            collar.rotation.x = Math.PI / 2;
            collar.position.set(offset, 0.01, 0.72);
            group.add(collar);
        }

        // Barrel brace
        const brace = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.015, 0.02), metal);
        brace.position.set(0, 0.01, 0.5);
        group.add(brace);

        // Front bead sight
        const frontSight = new THREE.Mesh(new THREE.SphereGeometry(0.006, 8, 6), this._chrome());
        frontSight.position.set(0, 0.035, 0.7);
        group.add(frontSight);

        // Pump handle (fore-end)
        const pump = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.055, 0.18), wood);
        pump.position.set(0, -0.035, 0.25);
        group.add(pump);
        // Pump grooves
        for (let i = 0; i < 5; i++) {
            const groove = new THREE.Mesh(new THREE.BoxGeometry(0.087, 0.003, 0.008), dark);
            groove.position.set(0, -0.035, 0.17 + i * 0.03);
            group.add(groove);
        }

        // Trigger guard
        const triggerGuard = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.004, 6, CYLINDER_SEGMENTS, Math.PI), dark);
        triggerGuard.rotation.y = Math.PI / 2;
        triggerGuard.position.set(0, -0.07, -0.04);
        group.add(triggerGuard);

        // Trigger
        const trigger = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.025, 0.01), this._metalMid());
        trigger.position.set(0, -0.065, -0.035);
        trigger.rotation.x = -0.3;
        group.add(trigger);

        // Pistol grip
        const grip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 0.04), rubber);
        grip.position.set(0, -0.1, -0.1);
        grip.rotation.x = 0.15;
        group.add(grip);

        // Fixed Stock (wooden)
        const stock = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.09, 0.32), wood);
        stock.position.z = -0.33;
        group.add(stock);
        // Stock butt plate
        const buttPlate = new THREE.Mesh(new THREE.BoxGeometry(0.067, 0.07, 0.01), rubber);
        buttPlate.position.z = -0.495;
        group.add(buttPlate);
        // Stock checkering
        for (let i = 0; i < 3; i++) {
            const check = new THREE.Mesh(new THREE.BoxGeometry(0.067, 0.003, 0.04), dark);
            check.position.set(0, -0.02 + i * 0.025, -0.4);
            group.add(check);
        }

        // Shell holder (side saddle)
        for (let i = 0; i < 4; i++) {
            const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.045, 8), this._chrome());
            shell.rotation.z = Math.PI / 2;
            shell.position.set(0.046, 0.015 - i * 0.02, -0.05);
            group.add(shell);
        }

        group.userData.muzzlePos = new THREE.Vector3(0, 0.01, 0.74);
        group.userData.gripData = {
            rightHand: { pos: new THREE.Vector3(0, -0.06, -0.15) },
            leftHand: { pos: new THREE.Vector3(0, -0.04, 0.25) }
        };
        return group;
    }

    // ========================================================
    // BOLT88 — Bolt-action Sniper Rifle
    // ========================================================
    static createBolt88() {
        const group = new THREE.Group();
        const metal = this._metalDark();
        const olive = this._olive();
        const dark = this._metalDark();
        const rubber = this._rubber();

        // Massive Receiver
        const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.1, 0.45), olive);
        group.add(receiver);

        // Action detail (bolt channel)
        const boltChannel = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.015, 0.2), dark);
        boltChannel.position.set(0, 0.055, 0.05);
        group.add(boltChannel);

        // Bolt handle
        const boltHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.04, 8), this._metalMid());
        boltHandle.rotation.z = Math.PI / 2;
        boltHandle.position.set(0.04, 0.055, 0.0);
        group.add(boltHandle);
        const boltKnob = new THREE.Mesh(new THREE.SphereGeometry(0.01, 8, 6), this._metalMid());
        boltKnob.position.set(0.06, 0.055, 0.0);
        group.add(boltKnob);

        // Long fluted barrel
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.018, 0.8, CYLINDER_SEGMENTS), metal);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.z = 0.6;
        group.add(barrel);

        // Barrel fluting (visual detail)
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const flute = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.003, 0.5), dark);
            flute.position.set(Math.cos(angle) * 0.016, Math.sin(angle) * 0.016, 0.5);
            group.add(flute);
        }

        // Heavy muzzle brake
        const muzzleBrake = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.04, 0.08), metal);
        muzzleBrake.position.z = 1.02;
        group.add(muzzleBrake);
        // Muzzle brake ports
        for (let i = 0; i < 3; i++) {
            for (const side of [-1, 1]) {
                const port = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.015, 0.012), dark);
                port.position.set(side * 0.03, 0, 0.99 + i * 0.02);
                group.add(port);
            }
        }

        // Trigger guard
        const triggerGuard = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.004, 6, CYLINDER_SEGMENTS, Math.PI), dark);
        triggerGuard.rotation.y = Math.PI / 2;
        triggerGuard.position.set(0, -0.065, -0.04);
        group.add(triggerGuard);

        // Trigger (match-grade)
        const trigger = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.025, 0.008), this._metalMid());
        trigger.position.set(0, -0.06, -0.035);
        trigger.rotation.x = -0.25;
        group.add(trigger);

        // --- Large Scope (detailed) ---
        // Scope mounts
        for (let i = 0; i < 2; i++) {
            const mount = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.025), metal);
            mount.position.set(0, 0.07, -0.03 + i * 0.2);
            group.add(mount);
            const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.015, CYLINDER_SEGMENTS), metal);
            ring.rotation.x = Math.PI / 2;
            ring.position.set(0, 0.1, -0.03 + i * 0.2);
            group.add(ring);
        }

        // Scope tube
        const scopeTube = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.32, CYLINDER_SEGMENTS), metal);
        scopeTube.rotation.x = Math.PI / 2;
        scopeTube.position.set(0, 0.1, 0.08);
        group.add(scopeTube);

        // Objective lens (front)
        const objBell = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.032, 0.06, CYLINDER_SEGMENTS), metal);
        objBell.rotation.x = Math.PI / 2;
        objBell.position.set(0, 0.1, 0.27);
        group.add(objBell);
        const objLens = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.005, CYLINDER_SEGMENTS), this._lens());
        objLens.rotation.x = Math.PI / 2;
        objLens.position.set(0, 0.1, 0.3);
        group.add(objLens);

        // Eyepiece lens (rear)
        const eyeLens = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.005, CYLINDER_SEGMENTS), this._lens());
        eyeLens.rotation.x = Math.PI / 2;
        eyeLens.position.set(0, 0.1, -0.08);
        group.add(eyeLens);

        // Scope turrets (windage/elevation)
        const turretW = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.025, CYLINDER_SEGMENTS), metal);
        turretW.position.set(0, 0.14, 0.06);
        group.add(turretW);
        const turretE = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.025, CYLINDER_SEGMENTS), metal);
        turretE.rotation.z = Math.PI / 2;
        turretE.position.set(0.045, 0.1, 0.06);
        group.add(turretE);

        // Parallax adjustment
        const parallax = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.025, CYLINDER_SEGMENTS), metal);
        parallax.rotation.z = Math.PI / 2;
        parallax.position.set(-0.045, 0.1, 0.06);
        group.add(parallax);

        // --- Thumbhole stock ---
        const stock = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.13, 0.35), olive);
        stock.position.z = -0.38;
        group.add(stock);

        // Cheek riser
        const cheekRiser = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.12), olive);
        cheekRiser.position.set(0, 0.07, -0.3);
        group.add(cheekRiser);

        // Stock butt pad
        const buttPad = new THREE.Mesh(new THREE.BoxGeometry(0.057, 0.1, 0.015), rubber);
        buttPad.position.set(0, -0.01, -0.56);
        group.add(buttPad);

        // Thumbhole cutout (dark inset to simulate)
        const thumbhole = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.06, 0.08), dark);
        thumbhole.position.set(0, -0.02, -0.24);
        group.add(thumbhole);

        // --- Bipod (folded) ---
        for (const side of [-1, 1]) {
            const bipodLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.15, 6), metal);
            bipodLeg.position.set(side * 0.025, -0.06, 0.15);
            bipodLeg.rotation.x = 0.3;
            group.add(bipodLeg);
            const bipodFoot = new THREE.Mesh(new THREE.SphereGeometry(0.008, 6, 4), rubber);
            bipodFoot.position.set(side * 0.025, -0.12, 0.19);
            group.add(bipodFoot);
        }

        // Sling swivel (front)
        const slingSwivel = new THREE.Mesh(new THREE.TorusGeometry(0.008, 0.002, 4, 8, Math.PI), metal);
        slingSwivel.position.set(0, -0.04, 0.2);
        slingSwivel.rotation.x = Math.PI / 2;
        group.add(slingSwivel);

        // Internal magazine
        const mag = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, 0.06), dark);
        mag.position.set(0, -0.08, 0.0);
        group.add(mag);

        group.userData.muzzlePos = new THREE.Vector3(0, 0, 1.06);
        group.userData.gripData = {
            rightHand: { pos: new THREE.Vector3(0, -0.05, -0.15) },
            leftHand: { pos: new THREE.Vector3(0, -0.02, 0.3) }
        };
        return group;
    }

    // ========================================================
    // SIDEARM — Two-tone Handgun
    // ========================================================
    static createSidearm() {
        const group = new THREE.Group();
        const steel = this._chrome();
        const black = this._metalDark();
        const rubber = this._rubber();

        // Slide
        const slide = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.04, 0.2), steel);
        slide.position.y = 0.025;
        group.add(slide);

        // Slide serrations (rear)
        for (let i = 0; i < 5; i++) {
            const serration = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.003, 0.005), black);
            serration.position.set(0, 0.025, -0.06 + i * 0.012);
            group.add(serration);
        }

        // Ejection port
        const ejPort = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.015, 0.03), black);
        ejPort.position.set(0.021, 0.035, 0.03);
        group.add(ejPort);

        // Front sight
        const frontSight = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.012, 0.005), black);
        frontSight.position.set(0, 0.05, 0.09);
        group.add(frontSight);

        // Rear sight
        const rearSight = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.012, 0.006), black);
        rearSight.position.set(0, 0.05, -0.04);
        group.add(rearSight);

        // Frame
        const frame = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.035, 0.14), black);
        frame.position.set(0, -0.005, 0.01);
        group.add(frame);

        // Trigger guard
        const triggerGuard = new THREE.Mesh(new THREE.TorusGeometry(0.012, 0.003, 6, CYLINDER_SEGMENTS, Math.PI), black);
        triggerGuard.rotation.y = Math.PI / 2;
        triggerGuard.position.set(0, -0.03, 0.01);
        group.add(triggerGuard);

        // Trigger
        const trigger = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.018, 0.006), this._metalMid());
        trigger.position.set(0, -0.025, 0.015);
        trigger.rotation.x = -0.3;
        group.add(trigger);

        // Barrel (visible through slide)
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.06, CYLINDER_SEGMENTS), this._metalMid());
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.015, 0.12);
        group.add(barrel);

        // Grip (textured)
        const grip = new THREE.Mesh(new THREE.BoxGeometry(0.033, 0.09, 0.04), rubber);
        grip.position.set(0, -0.06, -0.04);
        grip.rotation.x = 0.2;
        group.add(grip);
        // Grip stippling
        for (let i = 0; i < 3; i++) {
            for (const side of [-1, 1]) {
                const dot = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.004, 0.004), black);
                dot.position.set(side * 0.018, -0.04 - i * 0.015, -0.04);
                dot.rotation.x = 0.2;
                group.add(dot);
            }
        }

        // Magazine floor plate
        const magFloor = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.006, 0.032), this._metalMid());
        magFloor.position.set(0, -0.11, -0.04);
        magFloor.rotation.x = 0.2;
        group.add(magFloor);

        // Accessory rail (under-barrel)
        const accRail = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.006, 0.04), black);
        accRail.position.set(0, -0.025, 0.05);
        group.add(accRail);

        group.userData.muzzlePos = new THREE.Vector3(0, 0.02, 0.15);
        group.userData.gripData = {
            rightHand: { pos: new THREE.Vector3(0, -0.06, -0.04) },
            leftHand: null // Single handed
        };
        return group;
    }

    // ========================================================
    // KNIFE — Tactical Tanto
    // ========================================================
    static createKnife() {
        const group = new THREE.Group();
        // Use less reflective materials for knife to prevent black screen issue
        const chrome = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            metalness: 0.7,
            roughness: 0.15,
            transparent: true,
            opacity: 1.0
        });
        const carbon = this._rubber();
        const dark = this._metalDark();

        // Blade (tanto profile - two faces for thickness)
        const bladePrimary = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.04, 0.2), chrome);
        bladePrimary.position.z = 0.1;
        group.add(bladePrimary);

        // Blade edge bevel
        const bladeEdge = new THREE.Mesh(new THREE.BoxGeometry(0.001, 0.035, 0.18), this._metalLight());
        bladeEdge.position.set(0, -0.003, 0.1);
        group.add(bladeEdge);

        // Blade spine (thicker back)
        const bladeSpine = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.008, 0.18), dark);
        bladeSpine.position.set(0, 0.02, 0.1);
        group.add(bladeSpine);

        // Tanto tip (angled)
        const tip = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.025, 0.03), chrome);
        tip.position.set(0, 0.005, 0.21);
        tip.rotation.x = -0.2;
        group.add(tip);

        // Blood groove (fuller)
        const fuller = new THREE.Mesh(new THREE.BoxGeometry(0.001, 0.012, 0.1), dark);
        fuller.position.set(0, 0.005, 0.1);
        group.add(fuller);

        // Serrations (back edge, near handle)
        for (let i = 0; i < 5; i++) {
            const serration = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.008, 0.008), dark);
            serration.position.set(0, 0.02, 0.02 + i * 0.015);
            group.add(serration);
        }

        // Guard (hand stop)
        const guard = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.05, 0.012), dark);
        guard.position.z = 0.0;
        group.add(guard);

        // Handle (ergonomic, layered)
        const handleCore = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.014, 0.12, CYLINDER_SEGMENTS), carbon);
        handleCore.rotation.x = Math.PI / 2;
        handleCore.position.z = -0.06;
        group.add(handleCore);

        // Handle grooves
        for (let i = 0; i < 4; i++) {
            const groove = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.005, CYLINDER_SEGMENTS), dark);
            groove.rotation.x = Math.PI / 2;
            groove.position.z = -0.03 - i * 0.025;
            group.add(groove);
        }

        // Pommel (skull crusher)
        const pommel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.016, 0.015, CYLINDER_SEGMENTS), dark);
        pommel.rotation.x = Math.PI / 2;
        pommel.position.z = -0.13;
        group.add(pommel);

        // Lanyard hole
        const lanyardRing = new THREE.Mesh(new THREE.TorusGeometry(0.008, 0.002, 4, 8), dark);
        lanyardRing.position.z = -0.14;
        group.add(lanyardRing);

        group.userData.gripData = {
            rightHand: { pos: new THREE.Vector3(0, -0.015, -0.06) },
            leftHand: null // Single handed
        };

        // Ensure all knife meshes have proper material settings for viewmodel rendering
        group.traverse(child => {
            if (child.isMesh && child.material) {
                child.material.transparent = true;
                child.material.opacity = 1.0;
                child.castShadow = false;
                child.receiveShadow = false;
            }
        });

        return group;
    }
}

export default WeaponFactory;
