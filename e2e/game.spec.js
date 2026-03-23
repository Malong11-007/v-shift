import { test, expect } from '@playwright/test';

test.describe('V-SHIFT End-to-End Game Flow', () => {
  const gotoMainMenu = async (page) => {
    await page.addInitScript(() => {
      localStorage.setItem('vshift_callsign', 'CI_AGENT');
    });
    await page.goto('/');
    await expect(page.getByRole('button', { name: /^PLAY$/ })).toBeVisible({ timeout: 30000 });
  };

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('vshift_callsign', 'TESTPLAYER');
    });
  });

  test('should load the main menu and display the title', async ({ page }) => {
    await gotoMainMenu(page);

    // Verify title text exists
    await expect(page.locator('h1').first()).toContainText('V-SHIFT');

    // Verify PLAY/SETTINGS buttons
    await expect(page.getByRole('button', { name: /^PLAY$/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^SETTINGS$/ })).toBeVisible();
  });

  test('should allow selecting an archetype and deploying into the game', async ({ page }) => {
    await gotoMainMenu(page);

    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    // Click PLAY
    await page.getByRole('button', { name: /^PLAY$/ }).click();

    // Choose offline mode path
    await expect(page.getByRole('heading', { name: 'SELECT DEPLOYMENT MODE' })).toBeVisible();
    await page.getByRole('button', { name: 'DEPLOY NOW' }).click();

    // Verify Class Select screen
    await expect(page.getByRole('heading', { name: 'SELECT ARCHETYPE & LOADOUT' })).toBeVisible();

    // Click Archetype (KINETIC)
    await page.getByRole('heading', { name: 'KINETIC' }).click();

    // Click Deploy
    await page.getByRole('button', { name: 'DEPLOY TO ARENA' }).click();

    // Wait for the game canvas
    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible({ timeout: 20000 });

    // Ensure HUD health is visible
    const healthVal = page.locator('#hud-health-value');
    await expect(healthVal).toBeVisible({ timeout: 15000 });

    // Assert no exceptions
    expect(errors.length).toBe(0);
  });

  test('should allow modifying settings and persisting them', async ({ page }) => {
    await gotoMainMenu(page);

    // Open settings
    await page.getByRole('button', { name: /^SETTINGS$/ }).click();

    await expect(page.getByRole('heading', { name: 'SYSTEM SETTINGS' })).toBeVisible();

    // Change FOV. The FOV container usually has text 'FOV'
    const anySlider = page.locator('input[type="range"]').first();
    await expect(anySlider).toBeVisible();
    
    // Simulate setting value
    await anySlider.evaluate((el) => {
        el.value = 85;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // Close settings
    await page.getByRole('button', { name: '← BACK' }).click();
    await expect(page.getByRole('heading', { name: 'SYSTEM SETTINGS' })).toBeHidden();

    // Verify localStorage persistence
    const savedConfig = await page.evaluate(() => {
        return localStorage.getItem('vshift_settings');
    });

    expect(savedConfig).toContain('85');
  });
});
