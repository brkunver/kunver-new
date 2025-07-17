import { execa } from "execa"

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
  const spinner = ora("Creating React project...").start()
  spinner.color = "blue"

  try {
    await execa(command, { shell: true })
    spinner.succeed(chalk.green("Created React Project At " + chalk.bold.blue(name)))

    // install dependencies
    const dependencyInstallSuccess = await installDependencies(packageManager, name)
    if (!dependencyInstallSuccess) {
      console.log(chalk.red("❌ Failed to install dependencies for " + chalk.bold.blue(name)))
      console.log(chalk.red("Please install dependencies manually, tool will continue"))
    }

    if (dependencyInstallSuccess && packageManager == "pnpm") {
      await approveBuilds()
    }

    // copy config files
    copyConfigFiles(name)
    // install tailwind
    const tailwindInstallSuccess = await installTailwind(packageManager, name)
    if (!tailwindInstallSuccess) {
      console.log(chalk.red("❌ Failed to install tailwind for " + chalk.bold.blue(name)))
      console.log(chalk.red("Please install tailwind manually, tool will continue"))
    } else {
      console.log(chalk.green("✅ Installed tailwind for " + chalk.bold.blue(name)))
      if (packageManager == "pnpm") {
        await approveBuilds()
      }
    }
  } catch (error) {
    spinner.fail(`Failed to create React project at ${name}`)
  }
}
