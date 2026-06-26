import { defineConfig } from "vitest/config";
import path from "path";

/**
 * Minimal Vitest config for service-layer/Zod-schema unit tests.
 * Does not run in Next.js's build — purely a dev-time test runner.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
