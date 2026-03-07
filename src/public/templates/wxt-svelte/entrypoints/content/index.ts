import { mount, unmount } from "svelte"
import Content from "./Content.svelte"
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
        return mount(Content, { target: container })
      },
      onRemove: content => {
        unmount(content as any)
      },
    })

    ui.mount()
  },
})
