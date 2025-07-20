import { installWxt } from "../wxt-starter/install-wxt"
import { installDependencies } from "../helpers/install-deps"
import { copyConfigFiles } from "../helpers/copy-config-files"
import { pnpmApproveBuilds } from "../helpers/pnpm-approve"
import { bunApproveBuilds } from "../helpers/bun-approve"
import { packageManagers } from "../project-starter"
import { select } from "@inquirer/prompts"
import chalk from "chalk"
import { postInstallWxtSvelte } from "../wxt-starter/post-install-wxt-svelte"
import { join } from "node:path"

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

    const isWxtCreated = await installWxt(framework, packageManager, name, cwd)

    if (isWxtCreated) {
      const projectDir = join(cwd, name)
      // install dependencies
      await installDependencies(packageManager, name, cwd)

      // copy config files
      await copyConfigFiles(name, cwd)

      // run post-install steps for svelte template
      if (framework === "svelte") {
        await postInstallWxtSvelte(name, projectDir, packageManager)
      }

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
