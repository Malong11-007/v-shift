import { test, expect } from '@playwright/test';

test.describe('V-SHIFT End-to-End Game Flow', () => {

  test('should load the main menu and display the title', async ({ page }) => {
    // Navigate to the root URL
    await page.goto('/', { waitUntil: 'networkidle' });

    // Verify title text exists (increased timeout for headless asset generation)
    await expect(page.locator('h1')).toContainText('V-SHIFT', { timeout: 30000 });

    // Verify PLAY/SETTINGS buttons
    await expect(page.locator('button', { hasText: 'PLAY' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'SETTINGS' })).toBeVisible();
  });

  test('should allow selecting an archetype and deploying into the game', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'V-SHIFT' })).toBeVisible({ timeout: 15000 });

    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    // Click PLAY
    await page.getByRole('button', { name: /^PLAY$/ }).click();

    // Verify Class Select screen
    await expect(page.getByRole('heading', { name: 'SELECT ARCHETYPE & LOADOUT' })).toBeVisible();

    // Click Archetype (KINETIC)
    await page.getByRole('heading', { name: 'KINETIC' }).click();

    // Click Deploy
    await page.getByRole('button', { name: 'DEPLOY TO ARENA' }).click();

    // Wait for the game canvas
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 20000 });

    // Ensure HUD health is visible
    const healthVal = page.locator('#hud-health-value');
    await expect(healthVal).toBeVisible({ timeout: 15000 });

    // Assert no exceptions
    expect(errors.length).toBe(0);
  });

  test('should allow modifying settings and persisting them', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'V-SHIFT' })).toBeVisible({ timeout: 15000 });

    // Open settings
    await page.getByRole('button', { name: /^SETTINGS$/ }).click();

    await expect(page.getByRole('heading', { name: 'SETTINGS' })).toBeVisible();

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
    await page.getByRole('button', { name: '← BACK TO MENU' }).click();
    await expect(page.getByRole('heading', { name: 'SETTINGS' })).toBeHidden();

    // Verify localStorage persistence
    const savedConfig = await page.evaluate(() => {
        return localStorage.getItem('vshift_settings');
    });

    expect(savedConfig).toContain('85');
  });
});
