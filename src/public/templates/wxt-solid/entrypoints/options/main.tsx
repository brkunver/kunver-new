import { render } from "solid-js/web"
import "~/assets/tailwind.css"

import Options from "./Options"

render(() => <Options />, document.getElementById("root")!)

document.title = browser.runtime.getManifest().name
