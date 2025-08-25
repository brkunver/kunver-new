import path, { join } from "path"
import { fileURLToPath } from "url"

import * as constant from "@/constant"

import { approveBuilds, installDependencies, copyTemplateFolder, addManagerScript } from "@/helpers"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

type projectOptions = {
  name: string
  packageManager: constant.TpackageManager
  cwd?: string
}

// create react-ts project
export async function createReactProject(options: projectOptions) {
  const { name, packageManager, cwd = process.cwd() } = options
  // template path : dist/templates/react-ts-tw
  const templatePath = join(__dirname, "templates", "react-ts-tw")
  try {
    // copy template folder
    const isTemplateCopied = await copyTemplateFolder(templatePath, join(cwd, name))
    if (!isTemplateCopied) {
      throw new Error("Failed to copy template folder")
    }

    // Install dependencies
    const isDepsInstalled = await installDependencies(packageManager, name, cwd)
    if (!isDepsInstalled) {
      throw new Error("Failed to install dependencies")
    }

    // add manager script
    await addManagerScript(packageManager, name, cwd)

    // Approve builds
    await approveBuilds(packageManager, name, cwd)

    return true
  } catch (error) {
    console.error("Error creating React project:", error)
    throw error
  }
}
