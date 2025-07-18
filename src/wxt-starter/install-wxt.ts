import { spawn } from "node:child_process"
import ora from "ora"
import chalk from "chalk"

export async function installWxt(framework: string, packageManager: string, name: string, cwd: string) {
  let command: string
  switch (packageManager) {
    case "pnpm":
      command = `pnpm dlx wxt@latest init ${name} -t ${framework} --pm ${packageManager}`
      break
    case "npm":
      command = `npx wxt@latest init ${name} -t ${framework} --pm ${packageManager}`
      break
    case "bun":
      command = `bunx wxt@latest init ${name} -t ${framework} --pm ${packageManager}`
      break
    default:
      command = `bun wxt@latest init ${name} -t ${framework} --pm ${packageManager}`
  }

  return new Promise(resolve => {
    const child = spawn(command, { shell: true, cwd: cwd })
    const spinner = ora("Creating WXT project " + chalk.blue(name)).start()
    spinner.color = "blue"

    child.on("close", code => {
      if (code === 0) {
        spinner.succeed("Created WXT project at " + chalk.blue(name))
        resolve(true)
      } else {
        spinner.fail("Failed to create WXT project at " + chalk.blue(name))
        resolve(false)
      }
    })
  })
}
