import { execa } from "execa"
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

  const spinner = ora("Creating WXT project " + chalk.blue(name)).start()
  spinner.color = "blue"

  try {
    await execa(command, { shell: true, cwd: cwd })
    spinner.succeed("Created WXT project at " + chalk.blue(name))
    return true
  } catch (error) {
    spinner.fail("Failed to create WXT project at " + chalk.blue(name))
    return false
  }
}
