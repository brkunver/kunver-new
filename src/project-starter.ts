import { createWxtProject, createPythonNotebookProject } from "@/starters"

import { openInEditor, createTemplateProject } from "@/helpers"

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
      await createTemplateProject({
        templateName: "react-ts-tw",
        name: options.name,
        packageManager: options.packageManager,
      })
      break
    case "next-ts-prisma":
      await createTemplateProject({
        templateName: "next-ts-prisma",
        name: options.name,
        packageManager: options.packageManager,
      })
      break
    case "wxt":
      await createWxtProject({ name: options.name, packageManager: options.packageManager })
      break
    case "electron-svelte":
      await createTemplateProject({
        templateName: "electron-svelte",
        name: options.name,
        packageManager: options.packageManager,
      })
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
