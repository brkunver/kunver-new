import { defineConfig } from "vitest/config"
import { resolve } from "node:path"

export default defineConfig({
  test: {
    // Test environment (jsdom for React components, node for backend code)
    environment: "node", // Default environment

    // Test files pattern
    include: ["**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],

    // Setup files that run before each test file
    setupFiles: [],

    // Global test timeout (in milliseconds)
    testTimeout: 50000,

    // Watch mode configuration
    watch: false, // Disable watch mode by default (use --watch to enable)

    // Coverage configuration
    coverage: {
      provider: "v8", // or 'istanbul'
      reporter: ["text", "json", "html"],
      exclude: [
        "**/node_modules/**",
        "**/dist/**",
        "**/coverage/**",
        "**/*.d.ts",
        "**/.{idea,git,cache,output,temp}/**",
      ],
    },
  },

  // Aliases
  resolve: {
    alias: [
      {
        find: "@",
        replacement: resolve(__dirname, "./src"),
      },
    ],
  },
})
