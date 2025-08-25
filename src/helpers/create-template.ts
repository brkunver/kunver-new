import { join } from "path"

import { copyTemplateFolder, installDependencies, approveBuilds, addManagerScript } from "@/helpers"
import * as constant from "@/constant"

type projectOptions = {
  templateName: string
  name: string
  packageManager: constant.TpackageManager
  cwd?: string
}

// A generic function to create a project
export async function createTemplateProject(options: projectOptions) {
  const { templateName, name, packageManager, cwd = process.cwd() } = options

  // template path example : dist/templates/next-prisma

  const templatePath = join(__dirname, "templates", templateName)
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

    await approveBuilds(packageManager, name, cwd)

    return true
  } catch (error) {
    console.error("Error creating project:", error)
    throw error
  }
}
