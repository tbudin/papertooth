import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  // Playwright's default testMatch also takes *.test.mjs, which would load the
  // node:test unit suite in tests/unit: it ran twice, and a failure there was
  // not reported here at all. Browser tests are *.spec.mjs.
  testMatch: '**/*.spec.mjs',
  globalSetup: './tests/global-setup.mjs',
  // JavaScript modules need http: the repository is served for the tests that load them
  webServer: { command: 'node tests/server.mjs', url: 'http://localhost:4317/package.json', reuseExistingServer: !process.env.CI },
  fullyParallel: true,
  reporter: process.env.CI ? 'github' : 'list',
  // CI installs Playwright's Chromium; locally the installed Chrome is used, so nothing is downloaded
  use: { viewport: { width: 1000, height: 800 }, channel: process.env.CI ? undefined : 'chrome' }
});
