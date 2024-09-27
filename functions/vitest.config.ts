import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: "./src/setupTests.tsx",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
  },
});
