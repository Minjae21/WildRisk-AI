import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import type { UserConfig } from "vitest/config"; // Import UserConfig type

// Define test configuration separately
const testConfig: UserConfig["test"] = {
  globals: true, // Use global APIs like describe, it, expect
  environment: "jsdom", // Simulate DOM environment
  setupFiles: "./src/setupTests.ts", // Setup file (see next step)
  // Optional: configuration for coverage, etc.
  // coverage: {
  //   provider: 'v8', // or 'istanbul'
  //   reporter: ['text', 'json', 'html'],
  // },
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: testConfig,
});
