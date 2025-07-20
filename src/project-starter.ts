import { createReactProject } from "./starters/create-react"
import { createWxtProject } from "./starters/create-wxt"
import { openInEditor } from "./helpers/open-in-editor"

export const projects = ["react-ts-tw", "next-ts - !not ready", "wxt", "cpp-cmake - !not ready"] as const
export const packageManagers = ["bun", "pnpm", "npm"] as const

type options = {
  projectType: (typeof projects)[number]
  packageManager: (typeof packageManagers)[number]
  openInEditor: "no" | "windsurf" | "cursor" | "code"
  name: string
}

export default async function projectStarter(options: options) {
  switch (options.projectType) {
    case "react-ts-tw":
      await createReactProject({ name: options.name, packageManager: options.packageManager })
      break
    case "next-ts - !not ready":
      console.log("next-ts", options.packageManager, options.name)
      break
    case "wxt":
      await createWxtProject({ name: options.name, packageManager: options.packageManager })
      break
    case "cpp-cmake - !not ready":
      console.log("cpp-cmake", options.packageManager, options.name)
      break
    default:
      console.log("Invalid project type", options.projectType)
      break
  }

  if (options.openInEditor !== "no") {
    await openInEditor(options.name, process.cwd(), options.openInEditor)
  }
}
