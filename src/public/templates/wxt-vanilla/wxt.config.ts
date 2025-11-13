import { defineConfig } from "wxt"

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: {
    name: "wxt-vanilla-starter",
    description: "manifest.json description",
  },
  webExt: {
    disabled: true,
  },
})
