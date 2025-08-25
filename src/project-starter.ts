import {
  createReactProject,
  createNextProject,
  createWxtProject,
  createPythonNotebookProject,
  createElectronSvelteProject,
} from "@/starters"

import { openInEditor } from "@/helpers"

import * as constant from "./constant"

type options = {
  projectType: constant.TprojectType
  packageManager: constant.TpackageManager
  openInEditor: constant.TopenInEditor
  name: string
}

export default async function projectStarter(options: options) {
  switch (options.projectType) {
    case "react-ts-tw":
      await createReactProject({ name: options.name, packageManager: options.packageManager })
      break
    case "next-ts-prisma":
      await createNextProject({ name: options.name, packageManager: options.packageManager })
      break
    case "wxt":
      await createWxtProject({ name: options.name, packageManager: options.packageManager })
      break
    case "electron-svelte":
      await createElectronSvelteProject({ name: options.name, packageManager: options.packageManager })
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
