export const ARCHETYPES = {
    KINETIC: {
        id: 'KINETIC',
        name: 'Kinetic',
        description: 'Movement specialist. Wider window for perfect links.',
        bhopWindow: 0.08, // 80ms instead of 50ms (roughly 5 frames at 60fps)
        flinchMultiplier: 1.0,
        slideVolume: 1.0,
        maxSpeedMod: 1.05
    },
    STATIC: {
        id: 'STATIC',
        name: 'Static',
        description: 'Holding angles. Reduced flinch when taking damage.',
        bhopWindow: 0.05,
        flinchMultiplier: 0.5,
        slideVolume: 1.0,
        maxSpeedMod: 1.0
    },
    GHOST: {
        id: 'GHOST',
        name: 'Ghost',
        description: 'Infiltrator. Silent slides and lighter footsteps.',
        bhopWindow: 0.05,
        flinchMultiplier: 1.0,
        slideVolume: 0.0,
        maxSpeedMod: 1.0
    }
};
