import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';

vi.mock('../core/Engine.js', () => ({
    default: {
        scene: { add: vi.fn() },
        updatables: []
    }
}));

vi.mock('../physics/PhysicsWorld.js', () => ({
    default: {
        world: {
            createRigidBody: vi.fn(() => ({
                translation: () => ({ x: 0, y: 2, z: 0 }),
                linvel: () => ({ x: 0, y: 0, z: 0 }),
                setLinvel: vi.fn()
            })),
            createCollider: vi.fn(() => ({ handle: 1 })),
            removeRigidBody: vi.fn()
        },
        RAPIER: {
            RigidBodyDesc: {
                dynamic: () => ({
                    setTranslation: () => ({
                        lockRotations: () => ({})
                    })
                })
            },
            ColliderDesc: {
                capsule: () => ({
                    setMass: () => ({
                        setFriction: () => ({
                            setActiveEvents: () => ({})
                        })
                    })
                })
            },
            ActiveEvents: {
                COLLISION_EVENTS: 1
            }
        }
    }
}));

vi.mock('../physics/Collision.js', () => ({
    default: {
        castRay: vi.fn(() => null),
        colliderMap: new Map()
    }
}));

vi.mock('../core/AudioManager.js', () => ({
    default: {
        playSyntheticSfx: vi.fn()
    }
}));

vi.mock('../models/CharacterModel.js', () => ({
    default: class CharacterModel {
        constructor() {
            this.root = new THREE.Group();
            this.weaponMount = new THREE.Group();
        }
    }
}));

vi.mock('../models/ProceduralAnimator.js', () => ({
    default: class ProceduralAnimator {
        setWeaponPose() {}
        setState() {}
        update() {}
    }
}));

vi.mock('../models/WeaponFactory.js', () => ({
    default: {
        createWeapon: () => new THREE.Group()
    }
}));

vi.mock('../game/Ragdoll.js', () => ({
    default: class Ragdoll {
        constructor() {}
        destroy() {}
    }
}));

import gameState, { STATES } from '../core/GameState.js';
import roundManager, { ROUND_STATES } from '../game/RoundManager.js';
import engine from '../core/Engine.js';
import Bot from './Bot.js';

describe('Bot', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        gameState.currentState = STATES.PLAYING;
        roundManager.state = ROUND_STATES.FREEZE_TIME;
        engine.camera = { position: new THREE.Vector3(0, 2, 10) };
        window.localPlayer = { isAlive: true };
        vi.spyOn(performance, 'now').mockReturnValue(1000);
    });

    it('does not run combat AI during FREEZE_TIME', () => {
        const bot = new Bot('bot_1', new THREE.Vector3(0, 2, 0));
        bot.body = {
            translation: () => ({ x: 0, y: 2, z: 0 }),
            linvel: () => ({ x: 0, y: 0, z: 0 }),
            setLinvel: vi.fn()
        };
        bot.shoot = vi.fn();

        bot.update(0.016);

        expect(bot.shoot).not.toHaveBeenCalled();
    });

    it('does not shoot during spawn protection window even when attacking', () => {
        roundManager.state = ROUND_STATES.LIVE;
        const bot = new Bot('bot_2', new THREE.Vector3(0, 2, 0));
        bot.body = {
            translation: () => ({ x: 0, y: 2, z: 0 }),
            linvel: () => ({ x: 0, y: 0, z: 0 }),
            setLinvel: vi.fn()
        };
        bot.shoot = vi.fn();

        vi.mocked(performance.now).mockReturnValue(1500);
        bot.update(0.016);
        expect(bot.shoot).not.toHaveBeenCalled();

        vi.mocked(performance.now).mockReturnValue(3500);
        bot.update(0.016);
        expect(bot.shoot).toHaveBeenCalled();
    });
});
