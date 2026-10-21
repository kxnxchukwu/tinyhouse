import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    // The first run downloads a mongod binary for mongodb-memory-server.
    hookTimeout: 120_000
  }
});
