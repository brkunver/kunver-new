import { createReactProject } from "./starters/create-react"
import { createNextProject } from "./starters/create-next"
import { createWxtProject } from "./starters/create-wxt"
import { openInEditor } from "./helpers/open-in-editor"

export const projects = ["react-ts-tw", "next-ts-prisma", "wxt", "cpp-cmake - !not ready"] as const
export type TprojectType = (typeof projects)[number]
export const packageManagers = ["bun", "pnpm", "npm"] as const
export type TpackageManager = (typeof packageManagers)[number]

type options = {
  projectType: TprojectType
  packageManager?: TpackageManager
  openInEditor: "no" | "windsurf" | "cursor" | "code"
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
    case "cpp-cmake - !not ready":
      console.log("cpp-cmake", options.name)
      break
    default:
      console.log("Invalid project type", options.projectType)
      break
  }

  if (options.openInEditor !== "no") {
    await openInEditor(options.name, process.cwd(), options.openInEditor)
  }
}
