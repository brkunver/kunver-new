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
        const originalName = manifest.name
        manifest.name = "(DEV) " + originalName
        if (manifest.action) {
          manifest.action.default_title = "(DEV) " + (manifest.action.default_title || originalName)
        }
        if (manifest.browser_action) {
          manifest.browser_action.default_title = "(DEV) " + (manifest.browser_action.default_title || originalName)
        }
      }
    },
  },
  webExt: {
    disabled: true,
  },
})
