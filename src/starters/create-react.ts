import path, { join } from "node:path"
import { fileURLToPath } from "node:url"

import { installDependencies } from "../helpers/install-deps"
import { copyTemplateFolder } from "../helpers/copy-template"
import { pnpmApproveBuilds, bunApproveBuilds } from "../helpers/approve"
import { TpackageManager } from "../project-starter"
import { addManagerScript } from "../helpers/add-manager-script"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

type projectOptions = {
  name: string
  packageManager: TpackageManager
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
    if (packageManager === "pnpm") {
      await pnpmApproveBuilds(name, cwd)
    } else if (packageManager === "bun") {
      await bunApproveBuilds(name, cwd)
    }

    return true
  } catch (error) {
    console.error("Error creating React project:", error)
    throw error
  }
}
