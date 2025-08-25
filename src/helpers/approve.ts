import { spawn } from "node:child_process"

import ora from "ora"
import chalk from "chalk"
import { execa } from "execa"

import * as constant from "@/constant"

export default async function approveBuilds(
  packageManager: constant.TpackageManager,
  projectName: string,
  cwd: string,
) {
  switch (packageManager) {
    case "pnpm":
      return await pnpmApproveBuilds(projectName, cwd)
    case "bun":
      return await bunApproveBuilds(projectName, cwd)
    default:
      return false
  }
}

export async function pnpmApproveBuilds(projectName: string, cwd: string) {
  const spinner = ora("Approving builds for " + chalk.blue(projectName)).start()

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

async function bunApproveBuilds(projectName: string, cwd: string) {
  const command = `cd ${projectName} && bun pm trust --all`
  const spinner = ora("Approving builds for " + chalk.blue(projectName)).start()

  try {
    await execa(command, { shell: true, cwd: cwd })
    spinner.succeed("Approved builds for " + chalk.blue(projectName))
    return true
  } catch (error) {
    spinner.fail("Failed to approve builds for " + chalk.blue(projectName))
    return false
  }
}
