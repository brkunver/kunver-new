import { defineConfig } from "wxt"

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: {
    name: "wxt-vanilla-starter",
    description: "manifest.json description",
  },
  hooks: {
    "build:manifestGenerated": (wxt, manifest) => {
      if (wxt.config.mode === "development") {
        manifest.name = "(DEV) " + manifest.name
      }
    },
  },
  webExt: {
    disabled: true,
  },
})
