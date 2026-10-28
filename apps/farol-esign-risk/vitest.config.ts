import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["json", "text"],
      reportsDirectory: "reports/coverage",
      include: ["src/**/*.{ts,tsx}"],
    },
  },
});
