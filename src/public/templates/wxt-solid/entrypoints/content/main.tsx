// 1. Import the style
import "~/assets/tailwind.css"
import { render } from "solid-js/web"
import Content from "./Content"

export default defineContentScript({
  matches: ["<all_urls>"],
  // 2. Set cssInjectionMode
  cssInjectionMode: "ui",

  async main(ctx) {
    // 3. Define your UI
    const ui = await createShadowRootUi(ctx, {
      name: "example-ui",
      position: "inline",
      anchor: "body",
      onMount: container => {
        // Render your app to the UI container
        const unmount = render(() => <Content />, container)
        return unmount
      },
      onRemove: unmount => {
        // Unmount the app when the UI is removed
        unmount?.()
      },
    })

    // 4. Mount the UI
    ui.mount()
  },
})
