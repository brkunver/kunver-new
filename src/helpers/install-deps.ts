import { spawn } from "node:child_process"
import chalk from "chalk"
import ora from "ora"

export async function installDependencies(packageManager: string, name: string, cwd: string): Promise<boolean> {
  return new Promise(resolve => {
    let command: string

    switch (packageManager) {
      case "pnpm":
        command = `cd ${name} && pnpm install`
        break
      case "npm":
        command = `cd ${name} && npm install`
        break
      case "bun":
        command = `cd ${name} && bun install`
        break
      default:
        command = `cd ${name} && pnpm install`
    }

    const child = spawn(command, { shell: true, cwd: cwd })
    const spinner = ora("Installing dependencies with " + chalk.blue(packageManager)).start()
    spinner.color = "white"

    child.stderr.pipe(process.stderr)

    child.on("close", code => {
      if (code == 0) {
        spinner.succeed("Installed dependencies for " + chalk.blue(name))
        resolve(true)
      } else {
        spinner.fail("Failed to install dependencies for " + chalk.blue(name))
        resolve(false)
      }
    })
  })
}
