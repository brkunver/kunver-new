import { render } from "solid-js/web"
import "~/assets/tailwind.css"

import Popup from "./Popup"

render(() => <Popup />, document.getElementById("root")!)

document.title = browser.runtime.getManifest().name
