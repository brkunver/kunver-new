import ora from "ora"
import chalk from "chalk"
const { spawn } = await import("node:child_process")

export async function pnpmApproveBuilds(projectName: string, cwd: string) {
  const spinner = ora("Approving builds for " + chalk.blue(projectName)).start()
  spinner.color = "blue"

  try {
    // Use spawn instead of execa for better control over stdio

    return new Promise<boolean>(resolve => {
      const child = spawn("pnpm", ["approve-builds"], {
        cwd: `${cwd}/${projectName}`,
        stdio: ["pipe", "inherit", "inherit"],
        shell: true,
      })

      // Wait a bit for the prompt to appear, then send responses
      setTimeout(() => {
        child.stdin?.write("a\n") // 'a' for approve all
        setTimeout(() => {
          child.stdin?.write("y\n") // 'y' for yes/confirm
          child.stdin?.end()
        }, 1000)
      }, 2000)

      child.on("close", code => {
        if (code === 0) {
          spinner.succeed("Approved builds for " + chalk.blue(projectName))
          resolve(true)
        } else {
          spinner.fail("Failed to approve builds for " + chalk.blue(projectName))
          resolve(false)
        }
      })

      child.on("error", error => {
        spinner.fail("Failed to approve builds for " + chalk.blue(projectName))
        console.error(error)
        resolve(false)
      })
    })
  } catch (error) {
    spinner.fail("Failed to approve builds for " + chalk.blue(projectName))
    console.error(error)
    return false
  }
}
