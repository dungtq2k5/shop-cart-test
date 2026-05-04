import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

/**
 * Vitest configuration file.
 * - environment: "jsdom" simulates a browser DOM so React components can render.
 * - setupFiles: runs a global setup file before each test file.
 * - coverage: uses v8 (built-in Node.js coverage) to measure how much code is tested.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    exclude: ["**/node_modules/**", "**/e2e/**"],
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/utils/**", "src/lib/**"],
      thresholds: {
        lines: 80,
        functions: 80,
      },
    },
  },
});
