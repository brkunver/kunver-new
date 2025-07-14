import { spawn } from "node:child_process"
import chalk from "chalk"
import ora from "ora"

export function installDependencies(packageManager: string, name: string): Promise<boolean> {
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

    const child = spawn(command, { shell: true, cwd: process.cwd() })
    const spinner = ora("Installing dependencies with " + chalk.bold.blue(packageManager) + " ...")
    spinner.color = "white"
    spinner.start()
    
    child.stderr.pipe(process.stderr)

    child.on("close", code => {
      spinner.stop()
      if (code == 0) {
        console.log(chalk.green("✅ Installed dependencies for " + chalk.bold.blue(name)))
        resolve(true)
      } else {
        console.error(chalk.red("❌ Failed to install dependencies for " + chalk.bold.blue(name)))
        resolve(false)
      }
    })
  })
}
