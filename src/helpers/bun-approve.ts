import { execa } from "execa"
import ora from "ora"
import chalk from "chalk"

export async function bunApproveBuilds(projectName: string, cwd: string) {
  const command = `cd ${projectName} && bun pm trust --all`
  const spinner = ora("Approving builds for " + chalk.blue(projectName)).start()
  spinner.color = "blue"

  try {
    await execa(command, { shell: true, cwd: cwd })
    spinner.succeed("Approved builds for " + chalk.blue(projectName))
    return true
  } catch (error) {
    spinner.fail("Failed to approve builds for " + chalk.blue(projectName))
    return false
  }
}
