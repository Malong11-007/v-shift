import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';

// --- Mocks Setup ---
// We mock visual and IO dependencies to focus strictly on pure logic integration
vi.mock('../core/Engine.js', () => ({
    default: {
        camera: new THREE.PerspectiveCamera(),
        updatables: [],
        start: vi.fn(),
        timeScale: 1.0
    }
}));

vi.mock('../core/InputManager.js', () => ({
    default: {
        isKeyDown: vi.fn(() => false),
        getMouseDelta: vi.fn(() => ({ x: 0, y: 0 })),
        getMovementAxes: vi.fn(() => ({ x: 0, z: 0 })),
        isCrouching: vi.fn(() => false),
        isInputActive: vi.fn(() => true),
        isLocked: true,
        gamepadActive: false,
        touchActive: false,
        gamepadMove: { x: 0, z: 0 },
        gamepadLook: { x: 0, y: 0 },
        touchMove: { x: 0, z: 0 },
        touchLook: { x: 0, y: 0 },
        gamepadCrouchHeld: false,
        touchCrouchHeld: false
    }
}));

vi.mock('../core/AudioManager.js', () => ({
    default: {
        playSyntheticSfx: vi.fn()
    }
}));

vi.mock('../net/NetworkManager.js', () => ({
    default: {
        connected: false,
        send: vi.fn(),
        on: vi.fn()
    }
}));

vi.mock('../physics/PhysicsWorld.js', () => ({
    default: {
        createPlayerCapsule: vi.fn(() => ({ 
            body: { translation: () => ({x:0, y:0, z:0}), setTranslation: vi.fn(), setLinvel: vi.fn(), linvel: () => ({x:0, y:0, z:0}) }, 
            collider: {} 
        })),
        world: { castRay: vi.fn(() => null) },
        RAPIER: { Ray: function() { return {}; } }
    }
}));

import engine from '../core/Engine.js';
import input from '../core/InputManager.js';
import Player from './Player.js';
import WeaponSystem from './WeaponSystem.js';
import collision from '../physics/Collision.js';

describe('Player & Weapon System Integration', () => {
    let player;

    beforeEach(() => {
        vi.restoreAllMocks();
        // Clear collision maps
        collision.colliderMap.clear();

        player = new Player();
    });

    it('should equip primary weapon on initialization', () => {
        expect(player.weaponSystem).toBeInstanceOf(WeaponSystem);
        expect(player.weaponSystem.currentWeapon.id).toBe('V44SABRE');
    });

    it('should reduce player health when takeDamage is called and emit events', () => {
        const healthSpy = vi.spyOn(window, 'dispatchEvent');
        
        expect(player.health).toBe(100);
        player.takeDamage(25, false, { killerId: 'enemy-1' });
        
        expect(player.health).toBe(75);
        expect(player.isAlive).toBe(true);
        
        // Assert hit feedback
        const hitEvent = healthSpy.mock.calls.find(call => call[0].type === 'playerHit');
        expect(hitEvent).toBeDefined();
        expect(hitEvent[0].detail.amount).toBe(25);
    });

    it('should handle player death correctly', () => {
        const killSpy = vi.spyOn(window, 'dispatchEvent');
        
        player.takeDamage(150, true, { killerId: 'sniper-1' });
        
        expect(player.health).toBe(0);
        expect(player.isAlive).toBe(false);
        expect(engine.timeScale).toBeLessThan(1.0); // Slow-mo deathcam
        
        const deathEvent = killSpy.mock.calls.find(call => call[0].type === 'playerKilled');
        expect(deathEvent).toBeDefined();
        expect(deathEvent[0].detail.killerId).toBe('sniper-1');
        expect(deathEvent[0].detail.isHeadshot).toBe(true);
    });

    it('should allow player to fire hitscan weapons and deplete ammo', () => {
        const ws = player.weaponSystem;
        const initialAmmo = ws.ammo['V44SABRE'];
        
        ws.fireHitscan = vi.fn(); // Mock raycast part for isolation
        ws.fire();
        
        expect(ws.ammo['V44SABRE']).toBe(initialAmmo - 1);
        expect(ws.fireHitscan).toHaveBeenCalled();
    });

    it('should auto-reload when out of ammo', () => {
        const ws = player.weaponSystem;
        ws.ammo['V44SABRE'] = 0; // Empty mag
        
        const reloadSpy = vi.spyOn(ws, 'reload');
        ws.fire();
        
        expect(reloadSpy).toHaveBeenCalled();
        expect(ws.isReloading).toBe(true);
    });

    it('should update player rotation based on mouse movement', () => {
        player.sensitivity = 1.0;
        const initialYaw = player.yaw;
        const initialPitch = player.pitch;

        // Simulate mouse movement (10px right, 5px down)
        vi.mocked(input.getMouseDelta).mockReturnValue({ x: 10, y: 5 });
        
        // Update player
        player.update(0.016); // 60fps delta

        expect(player.yaw).not.toBe(initialYaw);
        expect(player.pitch).not.toBe(initialPitch);
        
        // Verify specifically the values (sensitivity is 1.0, multiplier is 0.002)
        // yaw -= 10 * 1.0 * 0.002 = -0.02
        expect(player.yaw).toBeCloseTo(initialYaw - 0.02, 5);
        expect(player.pitch).toBeCloseTo(initialPitch - 0.01, 5);
    });
});
