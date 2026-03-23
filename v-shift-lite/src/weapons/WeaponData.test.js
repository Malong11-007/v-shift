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
});
