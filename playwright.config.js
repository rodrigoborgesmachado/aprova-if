import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:5174",
    headless: true,
    trace: "retain-on-failure",
  },
  webServer: {
    command:
      "node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5174 --strictPort",
    url: "http://127.0.0.1:5174",
    reuseExistingServer: false,
    env: {
      VITE_ECOMMERCE_API_URL: "https://subscriptions.test/api",
      VITE_MONTHLY_OFFER_CODE: "test-monthly",
      VITE_SEMIANNUAL_OFFER_CODE: "test-semiannual",
      VITE_ANNUAL_OFFER_CODE: "test-annual",
    },
  },
});
