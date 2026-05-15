import { defineConfig } from "wxt"

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: {
    name: "wxt-vanilla-starter",
    description: "manifest.json description",
    browser_specific_settings: {
      gecko: {
        data_collection_permissions: {
          required: ["none"],
        },
      },
    },
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
