import { execa } from "execa"
import chalk from "chalk"

export async function installDependencies(packageManager: string, name: string, cwd: string): Promise<boolean> {
  let command: string = `cd ${name} && ${packageManager} install`

  console.log("Installing dependencies with " + chalk.cyan(packageManager) + "\n")

  try {
    await execa(command, { shell: true, cwd: cwd, stdout: "inherit", stderr: "inherit" })
    return true
  } catch (error) {
    return false
  }
}
