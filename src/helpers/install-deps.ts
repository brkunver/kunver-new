import { execa } from "execa"
import chalk from "chalk"
import ora from "ora"

export async function installDependencies(packageManager: string, name: string, cwd: string): Promise<boolean> {
  let command: string = `cd ${name} && ${packageManager} install`

  const spinner = ora("Installing dependencies with " + chalk.blue(packageManager)).start()

  try {
    await execa(command, { shell: true, cwd: cwd })
    spinner.succeed("Installed dependencies for " + chalk.blue(name))
    return true
  } catch (error) {
    spinner.fail("Failed to install dependencies for " + chalk.blue(name))
    return false
  }
}
