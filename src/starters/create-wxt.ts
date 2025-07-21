import { join } from "node:path"

import chalk from "chalk"
import { select } from "@inquirer/prompts"

import { installDependencies } from "../helpers/install-deps"
import { pnpmApproveBuilds, bunApproveBuilds } from "../helpers/approve"
import { packageManagers } from "../project-starter"

const wxtTemplates = [
  "react - !not ready",
  "vue - !not ready",
  "svelte",
  "vanilla - !not ready",
  "solid - !not ready",
] as const

type projectOptions = {
  name: string
  packageManager: (typeof packageManagers)[number]
  cwd?: string
  selectedFramework?: (typeof wxtTemplates)[number]
}

export async function createWxtProject(options: projectOptions) {
  const { name, packageManager, cwd = process.cwd(), selectedFramework } = options

  try {
    const framework: (typeof wxtTemplates)[number] =
      selectedFramework ||
      ((await select({
        message: chalk.bold.magenta("Select a framework for WXT"),
        choices: wxtTemplates,
        default: "svelte",
      })) as (typeof wxtTemplates)[number])

    //TODO : copy template folder
    const isWxtCreated = false

    if (isWxtCreated) {
      const projectDir = join(cwd, name)
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
