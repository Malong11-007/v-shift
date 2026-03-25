export const WEAPONS = {
    SIDEARM: {
        id: 'SIDEARM',
        name: 'Sidearm',
        type: 'semi',
        damage: { body: 28, head: 70 },
        magSize: 12,
        reloadTime: 1.5,
        cost: 0,
        killReward: 300,
        fireRate: 0.15, // seconds between shots
        moveSpeedMultiplier: 1.0,
        recoilX: 0.01,
        recoilY: 0.02
    },
    CINCH9: {
        id: 'CINCH9',
        name: 'Cinch-9',
        type: 'auto',
        damage: { body: 15, head: 38 },
        magSize: 35,
        reloadTime: 1.8,
        cost: 1500,
        killReward: 600,
        fireRate: 60 / 900, // 900 RPM
        moveSpeedMultiplier: 0.95,
        recoilX: 0.015,
        recoilY: 0.03
    },
    BREACH12: {
        id: 'BREACH12',
        name: 'Breach-12',
        type: 'pump',
        damage: { body: 12, head: 18 }, // Per pellet
        pellets: 8,
        magSize: 6,
        reloadTime: 0.5, // Per shell
        cost: 1800,
        killReward: 900,
        fireRate: 60 / 60, // 60 RPM
        moveSpeedMultiplier: 0.85,
        recoilX: 0.0,
        recoilY: 0.15
    },
    V44SABRE: {
        id: 'V44SABRE',
        name: 'V-44 Sabre',
        type: 'auto',
        damage: { body: 22, head: 88 },
        magSize: 30,
        reloadTime: 2.2,
        cost: 2700,
        killReward: 300,
        fireRate: 60 / 600, // 600 RPM
        moveSpeedMultiplier: 0.9,
        recoilX: 0.01,
        recoilY: 0.04
    },
    BOLT88: {
        id: 'BOLT88',
        name: 'Bolt-88',
        type: 'bolt',
        damage: { body: 100, head: 150 },
        magSize: 5,
        reloadTime: 3.5,
        cost: 4750,
        killReward: 100,
        fireRate: 60 / 40, // 40 RPM
        moveSpeedMultiplier: 0.8,
        recoilX: 0.0,
        recoilY: 0.2,
        scope: {
            zoomFov: 30,
            sensitivityMultiplier: 0.4
        }
    },
    KNIFE: {
        id: 'KNIFE',
        name: 'Tactical Knife',
        type: 'melee',
        damage: { slash: 50, backstab: 150 },
        cost: 0,
        killReward: 1500,
        fireRate: 0.6,
        moveSpeedMultiplier: 1.0,
        range: 2.5
    }
};
