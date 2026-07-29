import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    include: [
      "src/**/*.test.ts",
      "src/**/*.test.tsx",
      "apps/**/*.test.ts",
      "apps/**/*.test.tsx",
      "packages/**/*.test.ts"
    ]
  }
});
