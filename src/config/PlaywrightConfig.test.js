import { describe, expect, it } from 'vitest';
import playwrightConfig from '../../playwright.config.js';

describe('Playwright CI reporting config', () => {
  it('enables failure screenshots and report outputs for CI artifacts', () => {
    expect(playwrightConfig.use.screenshot).toBe('only-on-failure');

    const reporters = playwrightConfig.reporter.map(([name]) => name);
    expect(reporters).toContain('html');
    expect(reporters).toContain('json');
  });
});
