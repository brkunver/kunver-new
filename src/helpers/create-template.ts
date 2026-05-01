import { join, dirname } from "path"
import { fileURLToPath } from "url"
import { existsSync } from "fs"

import {
  copyTemplateFolder,
  installDependencies,
  approveBuilds,
  addManagerScript,
  configurePackageManager,
  changeProjectName,
} from "@/helpers"
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

async function runStep(stepName: string, step: () => Promise<boolean | void>) {
  const result = await step()

  if (result === false) {
    throw new Error(`Failed to ${stepName}`)
  }
}

function resolveTemplatePath(templateName: string) {
  const devTemplatePath = join(currentDir, "../public/templates", templateName)
  const prodTemplatePath = join(currentDir, "templates", templateName)

  return existsSync(devTemplatePath) ? devTemplatePath : prodTemplatePath
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

  const projectPath = join(cwd, name)
  const templatePath = resolveTemplatePath(templateName)

  try {
    await runStep("copy template folder", () => copyTemplateFolder(templatePath, projectPath))

    if (onBeforeInstall) {
      await runStep("run pre-install hook", () => onBeforeInstall(projectPath))
    }

    if (addManager) {
      await runStep("configure package manager", () => configurePackageManager(packageManager, projectPath))
    }

    if (installDependency) {
      await runStep("install dependencies", () => installDependencies(packageManager, name, cwd))
    }

    if (addManager) {
      await runStep("add manager script", () => addManagerScript(packageManager, name, cwd))
    }

    if (approveBuild) {
      await runStep("approve builds", () => approveBuilds(packageManager, name, cwd))
    }

    if (changeName) {
      await runStep("change project name", () => changeProjectName(projectPath, name))
    }

    return true
  } catch (error) {
    console.error("Error creating project:", error)
    throw error
  }
}
