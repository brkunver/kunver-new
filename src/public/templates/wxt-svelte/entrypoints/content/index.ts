import { mount, unmount } from "svelte"
import App from "./App.svelte"
import "~/assets/tailwind.css"

export default defineContentScript({
  matches: ["<all_urls>"],

  cssInjectionMode: "ui",

  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: "ext-ui",
      position: "inline",
      anchor: "body",
      onMount: container => {
        return mount(App, { target: container })
      },
      onRemove: app => {
        unmount(app as any)
      },
    })

    ui.mount()
  },
})
