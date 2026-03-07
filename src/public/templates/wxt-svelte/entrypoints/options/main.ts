import { mount } from "svelte"
import Options from "./Options.svelte"
import "~/assets/tailwind.css"

const app = mount(Options, {
  target: document.getElementById("app")!,
})

export default app
