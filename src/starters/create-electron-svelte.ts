import { join } from "path"

import * as constant from "@/constant"

import { copyTemplateFolder, installDependencies, approveBuilds, addManagerScript } from "@/helpers"

type projectOptions = {
  name: string
  packageManager: constant.TpackageManager
  cwd?: string
}

export async function createElectronSvelteProject(options: projectOptions) {
  const { name, packageManager, cwd = process.cwd() } = options
  const templatePath = join(__dirname, "templates", "electron-svelte")
  try {
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
    console.error("Error creating Electron Svelte project:", error)
    throw error
  }
}
