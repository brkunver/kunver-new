import path, { join } from "node:path"
import { fileURLToPath } from "node:url"

import chalk from "chalk"
import { select } from "@inquirer/prompts"

import { installDependencies } from "../helpers/install-deps"
import { pnpmApproveBuilds, bunApproveBuilds } from "../helpers/approve"
import { TpackageManager } from "../project-starter"
import { copyTemplateFolder } from "../helpers/copy-template"
import { addManagerScript } from "../helpers/add-manager-script"

const wxtTemplates = [
  "react - !not ready",
  "vue - !not ready",
  "svelte",
  "vanilla - !not ready",
  "solid - !not ready",
] as const

type wxtTemplatesType = (typeof wxtTemplates)[number]

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

type projectOptions = {
  name: string
  packageManager: TpackageManager
  cwd?: string
  selectedFramework?: wxtTemplatesType
}

export async function createWxtProject(options: projectOptions) {
  const { name, packageManager, cwd = process.cwd(), selectedFramework } = options

  try {
    const framework: wxtTemplatesType =
      selectedFramework ||
      ((await select({
        message: chalk.bold.magenta("Select a framework for WXT"),
        choices: wxtTemplates,
        default: "svelte",
      })) as wxtTemplatesType)

    // default template path
    let templatePath = join(__dirname, "templates", "wxt-svelte")
    if (framework === "svelte") {
      templatePath = join(__dirname, "templates", "wxt-svelte")
    }

    const isWxtCreated = await copyTemplateFolder(templatePath, join(cwd, name))
    if (isWxtCreated) {
      await addManagerScript(packageManager, name, cwd)

      // install dependencies
      await installDependencies(packageManager, name, cwd)

      // approve builds
      if (packageManager === "pnpm") {
        await pnpmApproveBuilds(name, cwd)
      } else if (packageManager === "bun") {
        await bunApproveBuilds(name, cwd)
      }
    }
  } catch (error) {
    console.error(error)
  }
}
