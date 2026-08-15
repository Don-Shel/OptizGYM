import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./server/test/setup.ts"],
    include: ["server/**/*.{test,spec}.{ts,tsx}"],
  },
  resolve: {
    alias: { 
      "@": path.resolve(__dirname, "./server/src"),
      "~": path.resolve(__dirname, "./src")
    },
  },
});
