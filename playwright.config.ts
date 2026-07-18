import { defineConfig, devices } from '@playwright/test';

const executablePath=process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45_000,
  fullyParallel: false,
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
    ...(executablePath ? { launchOptions: { executablePath, args: ['--no-sandbox','--no-proxy-server'] } } : {})
  },
  webServer: [
    { command: 'npm run dev -w @mackerel/server', url: 'http://localhost:3000/health', reuseExistingServer: true, timeout: 120_000 },
    { command: 'npm run dev -w @mackerel/client -- --host 127.0.0.1', url: 'http://localhost:4173', reuseExistingServer: true, timeout: 120_000 }
  ],
  projects: [{ name: 'chromium-mobile', use: { ...devices['Pixel 7'], viewport: { width: 915, height: 412 } } }]
});
