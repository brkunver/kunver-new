import { prettierConfigFile, pushFile } from "./config-files"
import { writeFile, access } from "node:fs/promises"
import { join } from "node:path"
import { execSync } from "child_process"
import chalk from "chalk"
import ora from "ora"

export async function copyConfigFiles(projectName: string, cwd: string) {
  const projectPath = join(cwd, projectName)
  const pushShPath = join(projectPath, "push.sh")

  const spinner = ora("Copying config files to " + chalk.blue(projectName)).start()
  spinner.color = "blue"

  try {
    // Check if project directory exists
    await access(projectPath)

    // Write both files concurrently
    await Promise.all([
      writeFile(join(projectPath, ".prettierrc.json"), prettierConfigFile),
      writeFile(pushShPath, pushFile),
    ])

    // Make push.sh executable
    try {
      execSync(`chmod +x "${pushShPath}"`)
    } catch (error) {
      console.error(chalk.red("Failed to make push.sh executable"))
    }
    spinner.succeed("Config files copied and push.sh is executable")
  } catch (error) {
    spinner.fail("Failed to copy config files or set permissions")
    console.error(error)
    throw error // Re-throw error so tests can handle it
  }
}
