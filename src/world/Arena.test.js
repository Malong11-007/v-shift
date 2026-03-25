import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';

vi.mock('../physics/PhysicsWorld.js', () => ({
    default: {
        createStaticBox: vi.fn()
    }
}));

import arena from './Arena.js';

describe('Arena', () => {
    it('has 10 player spawn points for up to 10v10', () => {
        expect(arena.spawnPoints.player.length).toBe(10);
    });

    it('has 10 bot spawn points for up to 10v10', () => {
        expect(arena.spawnPoints.bots.length).toBe(10);
    });

    it('getPlayerSpawns returns requested number of unique spawns', () => {
        const spawns = arena.getPlayerSpawns(5);
        expect(spawns.length).toBe(5);
        // All should be distinct Vector3 instances
        const positions = spawns.map(s => `${s.x},${s.y},${s.z}`);
        expect(new Set(positions).size).toBe(5);
    });

    it('getBotSpawns returns requested number of unique spawns', () => {
        const spawns = arena.getBotSpawns(8);
        expect(spawns.length).toBe(8);
        const positions = spawns.map(s => `${s.x},${s.y},${s.z}`);
        expect(new Set(positions).size).toBe(8);
    });

    it('getPlayerSpawns caps at available spawn count', () => {
        const spawns = arena.getPlayerSpawns(20);
        expect(spawns.length).toBe(10);
    });

    it('getBotSpawns caps at available spawn count', () => {
        const spawns = arena.getBotSpawns(15);
        expect(spawns.length).toBe(10);
    });

    it('getPlayerSpawn returns a valid spawn point', () => {
        const spawn = arena.getPlayerSpawn();
        expect(spawn).toBeInstanceOf(THREE.Vector3);
    });

    it('getBotSpawn returns a valid spawn point', () => {
        const spawn = arena.getBotSpawn();
        expect(spawn).toBeInstanceOf(THREE.Vector3);
    });
});
