import { createReactProject } from "./starters/create-react"

export const projects = ["react-ts-tw", "next-ts", "wxt", "wxt", "cpp-cmake"] as const
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
      console.log("wxt-react", options.packageManager, options.name)
      break
    default:
      console.log("Invalid project type", options.projectType)
      break
  }
}
