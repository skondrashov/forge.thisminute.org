import { defineConfig } from '@playwright/test';

export default defineConfig({
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:3939',
  },
  webServer: {
    command: 'npx serve -l 3939 --no-clipboard',
    port: 3939,
    reuseExistingServer: true,
  },
  projects: [
    {
      name: 'orchestration',
      testDir: './orchestration/tests/e2e',
      use: { browserName: 'chromium' },
    },
    {
      name: 'site-wide',
      testDir: './tests/e2e',
      use: { browserName: 'chromium' },
    },
  ],
});
