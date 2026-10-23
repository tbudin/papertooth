import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  globalSetup: './tests/global-setup.mjs',
  fullyParallel: true,
  reporter: process.env.CI ? 'github' : 'list',
  // CI installs Playwright's Chromium; locally the installed Chrome is used, so nothing is downloaded
  use: { viewport: { width: 1000, height: 800 }, channel: process.env.CI ? undefined : 'chrome' }
});
