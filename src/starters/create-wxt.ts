import { installWxt } from "../wxt-starter/install-wxt"
import { installDependencies } from "../helpers/install-deps"
import { copyConfigFiles } from "../helpers/copy-config-files"
import { pnpmApproveBuilds } from "../helpers/pnpm-approve"
import { bunApproveBuilds } from "../helpers/bun-approve"
import { packageManagers } from "../project-starter"
import { select } from "@inquirer/prompts"
import chalk from "chalk"

const wxtTemplates = ["react", "vue", "svelte", "vanilla", "solid"] as const

type projectOptions = {
  name: string
  packageManager: (typeof packageManagers)[number]
  cwd?: string
}

export async function createWxtProject(options: projectOptions) {
  const { name, packageManager, cwd = process.cwd() } = options

  try {
    const framework: (typeof wxtTemplates)[number] = await select({
      message: chalk.bold.magenta("Select a framework for WXT"),
      choices: wxtTemplates,
      default: "svelte",
    })

    const isWxtCreated = await installWxt(framework, packageManager, name, cwd)

    if (isWxtCreated) {
      // install dependencies
      await installDependencies(packageManager, name, cwd)

      // copy config files
      await copyConfigFiles(name, cwd)

      // WXT has its own Tailwind setup, so we might not need a separate `installTailwind` step.
      // We need to investigate how to integrate Tailwind properly with WXT's structure.
      // COMMENT: Need to check if a separate Tailwind installation is needed or if it's handled by WXT templates.

      // approve builds
      if (packageManager === "pnpm") {
        // COMMENT: Need to confirm if pnpmApproveBuilds is necessary for WXT projects.
        await pnpmApproveBuilds(name, cwd)
      } else if (packageManager === "bun") {
        // COMMENT: Need to confirm if bunApproveBuilds is necessary for WXT projects.
        await bunApproveBuilds(name, cwd)
      }

      // COMMENT: Need to check if there are any post-installation steps required for WXT, similar to `postInstallReact`.
    }
  } catch (error) {
    console.error(error)
  }
}
