import { execa } from "execa"
import ora from "ora"
import chalk from "chalk"

export async function installReact(packageManager: string, name: string, cwd: string): Promise<boolean> {
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

  const spinner = ora("Creating React project " + chalk.blue(name)).start()
  spinner.color = "blue"

  try {
    await execa(command, { shell: true, cwd: cwd })
    spinner.succeed("Created React project at " + chalk.blue(name))
    return true
  } catch (error) {
    spinner.fail("Failed to create React project at " + chalk.blue(name))
    return false
  }
}
