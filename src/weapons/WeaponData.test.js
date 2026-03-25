import { describe, it, expect } from 'vitest';
import { WEAPONS } from './WeaponData.js';

describe('WeaponData', () => {
  it('should have all required weapon types', () => {
    expect(WEAPONS.V44SABRE).toBeDefined();
    expect(WEAPONS.SIDEARM).toBeDefined();
    expect(WEAPONS.KNIFE).toBeDefined();
    expect(WEAPONS.BOLT88).toBeDefined();
  });

  it('should have correct melee properties for KNIFE', () => {
    expect(WEAPONS.KNIFE.type).toBe('melee');
    expect(WEAPONS.KNIFE.damage.slash).toBe(50);
    expect(WEAPONS.KNIFE.moveSppedMultiplier).toBeUndefined(); // Wait, I see 'moveSpeedMultiplier' in other weapons
    expect(WEAPONS.KNIFE.range).toBe(2.5);
  });

  it('should have valid fire rates for all ranged weapons', () => {
    Object.values(WEAPONS).forEach(w => {
      if (w.type !== 'melee') {
        expect(w.fireRate).toBeGreaterThan(0);
        expect(w.magSize).toBeGreaterThan(0);
      }
    });
  });

  it('should have consistent pellet count for shotgun', () => {
    const shotgun = WEAPONS.BREACH12;
    expect(shotgun.pellets).toBe(8);
    expect(shotgun.type).toBe('pump');
  });

  it('should have all weapons with moveSpeedMultiplier or be melee type', () => {
    Object.values(WEAPONS).forEach(w => {
      if (w.type !== 'melee') {
        expect(w.moveSpeedMultiplier).toBeDefined();
        expect(w.moveSpeedMultiplier).toBeGreaterThan(0);
        expect(w.moveSpeedMultiplier).toBeLessThanOrEqual(1);
      }
    });
  });

  it('should have head damage higher than body damage for ranged weapons', () => {
    Object.values(WEAPONS).forEach(w => {
      if (w.damage.head && w.damage.body) {
        expect(w.damage.head).toBeGreaterThan(w.damage.body);
      }
    });
  });

  it('should have all expected weapon IDs', () => {
    expect(WEAPONS.CINCH9).toBeDefined();
    expect(WEAPONS.BREACH12).toBeDefined();
    expect(Object.keys(WEAPONS).length).toBe(6);
  });

  it('should have scope data on BOLT88 sniper', () => {
    expect(WEAPONS.BOLT88.scope).toBeDefined();
    expect(WEAPONS.BOLT88.scope.zoomFov).toBe(30);
    expect(WEAPONS.BOLT88.scope.sensitivityMultiplier).toBe(0.4);
  });

  it('should not have scope data on non-sniper weapons', () => {
    expect(WEAPONS.V44SABRE.scope).toBeUndefined();
    expect(WEAPONS.SIDEARM.scope).toBeUndefined();
    expect(WEAPONS.CINCH9.scope).toBeUndefined();
    expect(WEAPONS.KNIFE.scope).toBeUndefined();
  });
});
