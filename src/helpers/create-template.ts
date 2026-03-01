import { join, dirname } from "path"
import { fileURLToPath } from "url"
import { existsSync } from "fs"

import { copyTemplateFolder, installDependencies, approveBuilds, addManagerScript, changeProjectName } from "@/helpers"
import * as constant from "@/constant"

// A cross-runtime and cross-module-format compatible way to get the current directory
function getDirname() {
  if (typeof __dirname !== "undefined") {
    // In CJS or runtimes that provide __dirname
    return __dirname
  }

  if (typeof import.meta !== "undefined" && import.meta.url) {
    // In ESM
    return dirname(fileURLToPath(import.meta.url))
  }

  // Fallback, usually process.cwd() or similar, but typically the above covers all bases
  return process.cwd()
}

const currentDir = getDirname()

type projectOptions = {
  templateName: string
  name: string
  packageManager: constant.TpackageManager
  addManager?: boolean
  approveBuild?: boolean
  changeName?: boolean
  installDependency?: boolean
  cwd?: string
  onBeforeInstall?: (projectPath: string) => Promise<void>
}

// A generic function to create a project
export async function createTemplateProject(options: projectOptions) {
  const {
    templateName,
    name,
    packageManager,
    cwd = process.cwd(),
    addManager = true,
    changeName = true,
    approveBuild = true,
    installDependency = true,
    onBeforeInstall,
  } = options

  const devTemplatePath = join(currentDir, "../public/templates", templateName)
  const prodTemplatePath = join(currentDir, "templates", templateName)
  const templatePath = existsSync(devTemplatePath) ? devTemplatePath : prodTemplatePath

  try {
    // copy template folder
    const isTemplateCopied = await copyTemplateFolder(templatePath, join(cwd, name))
    if (!isTemplateCopied) {
      throw new Error("Failed to copy template folder")
    }

    // Call onBeforeInstall hook before installing dependencies
    if (onBeforeInstall) {
      await onBeforeInstall(join(cwd, name))
    }

    // Install dependencies
    if (installDependency) {
      const isDepsInstalled = await installDependencies(packageManager, name, cwd)
      if (!isDepsInstalled) {
        throw new Error("Failed to install dependencies")
      }
    }

    // add manager script
    if (addManager) {
      await addManagerScript(packageManager, name, cwd)
    }

    if (approveBuild) {
      await approveBuilds(packageManager, name, cwd)
    }

    if (changeName) {
      await changeProjectName(join(cwd, name), name)
    }

    return true
  } catch (error) {
    console.error("Error creating project:", error)
    throw error
  }
}
