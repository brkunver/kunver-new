import { spawn } from "node:child_process"

import ora from "ora"
import chalk from "chalk"

import { installDependencies } from "../helpers/install-deps"
import { installTailwind } from "../helpers/install-tailwind"
import { copyConfigFiles } from "../helpers/copy-config-files"
import { approveBuilds } from "../helpers/pnpm-approve"

type projectOptions = {
  name: string
  packageManager: string
}

// create react-ts project
export async function createReactProject(options: projectOptions) {
  const { name, packageManager } = options
  let command: string
  switch (packageManager) {
    case "pnpm":
      command = `pnpm create vite ${name} --template react-swc-ts`
      break
    case "npm":
      command = `npm create vite@latest ${name} -- --template react-swc-ts`
      break
    case "bun":
      command = `bun create vite ${name} --template react-swc-ts`
      break
    default:
      command = `pnpm create vite ${name} --template react-swc-ts`
  }
  const child = spawn(command, { shell: true })
  const spinner = ora("Creating React project...")
  spinner.color = "blue"
  spinner.start()

  child.on("close", async code => {
    spinner.stop()
    if (code == 0) {
      console.log(chalk.green("Created React Project At " + chalk.bold.blue(name)))
      // install dependencies
      const dependencyInstallSuccess = await installDependencies(packageManager, name)
      if (!dependencyInstallSuccess) {
        console.log(chalk.red("❌ Failed to install dependencies for " + chalk.bold.blue(name)))
        console.log(chalk.red("Please install dependencies manually, tool will continue"))
      }
      if (dependencyInstallSuccess && packageManager == "pnpm") {
        approveBuilds()
      }

      // copy config files
      copyConfigFiles(name)
    } else {
      console.error(`Failed to create React project at ${name}`)
    }
  })
}
