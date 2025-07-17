import { spawn } from "node:child_process"
import ora from "ora"
import chalk from "chalk"

export function installReact(packageManager: string, name: string): Promise<boolean> {
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

  return new Promise(resolve => {
    const child = spawn(command, { shell: true, cwd: process.cwd() })
    const spinner = ora("Creating React project " + chalk.blue(name)).start()
    spinner.color = "blue"

    child.on("close", code => {
      if (code === 0) {
        spinner.succeed("Created React project at " + chalk.blue(name))
        resolve(true)
      } else {
        spinner.fail("Failed to create React project at " + chalk.blue(name))
        resolve(false)
      }
    })
  })

}