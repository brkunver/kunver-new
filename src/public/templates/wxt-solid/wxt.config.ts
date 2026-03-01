import { defineConfig } from "wxt"
import tailwindcss from "@tailwindcss/vite"

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: {
    name: "wxt-solid-starter",
    description: "manifest.json description",
    //permissions: ["storage"],
  },
  modules: ["@wxt-dev/module-solid"],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  webExt: {
    disabled: true,
  },
})
