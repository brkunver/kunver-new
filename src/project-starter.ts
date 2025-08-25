import { createReactProject } from "@/starters/create-react"
import { createNextProject } from "@/starters/create-next"
import { createWxtProject } from "@/starters/create-wxt"
import { createPythonNotebookProject } from "@/starters/create-python-notebook"
import { openInEditor } from "@/helpers/open-in-editor"

import * as constant from "./constant"

type options = {
  projectType: constant.TprojectType
  packageManager?: constant.TpackageManager
  openInEditor: constant.TopenInEditor
  name: string
}

export default async function projectStarter(options: options) {
  switch (options.projectType) {
    case "react-ts-tw":
      await createReactProject({ name: options.name, packageManager: options.packageManager! })
      break
    case "next-ts-prisma":
      await createNextProject({ name: options.name, packageManager: options.packageManager! })
      break
    case "wxt":
      await createWxtProject({ name: options.name, packageManager: options.packageManager! })
      break
    case "python-notebook":
      await createPythonNotebookProject({ name: options.name })
      break
    default:
      console.log("Project Type Not Implemented", options.projectType)
      break
  }

  if (options.openInEditor !== "no") {
    await openInEditor(options.name, process.cwd(), options.openInEditor)
  }
}
