import { spawn } from "node:child_process"
import ora from "ora"
import chalk from "chalk"

export async function bunApproveBuilds(projectName: string, cwd: string) {
  return new Promise(resolve => {
    const child = spawn("bun pm trust --all", { shell: true, cwd: cwd })
    const spinner = ora("Approving builds for " + chalk.blue(projectName)).start()
    spinner.color = "blue"

    child.on("close", code => {
      if (code === 0) {
        spinner.succeed("Approved builds for " + chalk.blue(projectName))
        resolve(true)
      } else {
        spinner.fail("Failed to approve builds for " + chalk.blue(projectName))
        resolve(false)
      }
    })
  })
}
