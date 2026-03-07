import { execa } from "execa"
import chalk from "chalk"
import { join } from "path"

export async function installDependencies(packageManager: string, name: string, cwd: string): Promise<boolean> {
  const projectPath = join(cwd, name)

  console.log("Installing dependencies with " + chalk.cyan(packageManager) + "\n")

  try {
    await execa(packageManager, ["install"], {
      cwd: projectPath,
      stdout: "inherit",
      stderr: "inherit",
    })
    return true
  } catch {
    return false
  }
}
