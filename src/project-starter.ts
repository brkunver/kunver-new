import { createReactProject } from "./starters/create-react"
import { createWxtProject } from "./starters/create-wxt"
import { installWxt } from "./wxt-starter/install-wxt"

export const projects = ["react-ts-tw", "next-ts", "wxt", "cpp-cmake"] as const
export const packageManagers = ["bun", "pnpm", "npm"] as const

type options = {
  projectType: (typeof projects)[number]
  packageManager: (typeof packageManagers)[number]
  name: string
}

export default function projectStarter(options: options) {
  switch (options.projectType) {
    case "react-ts-tw":
      createReactProject({ name: options.name, packageManager: options.packageManager })
      break
    case "next-ts":
      console.log("next-ts", options.packageManager, options.name)
      break
    case "wxt":
      createWxtProject({ name: options.name, packageManager: options.packageManager })
      break
    case "cpp-cmake":
      console.log("cpp-cmake", options.packageManager, options.name)
      break
    default:
      console.log("Invalid project type", options.projectType)
      break
  }
}
