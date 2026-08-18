import { join } from "path"

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
    case "npm":
      return true
    default:
      return true
  }
}

export async function pnpmApproveBuilds(projectName: string, cwd: string) {
  const spinner = ora("Approving builds for " + chalk.blue(projectName)).start()
  const projectPath = join(cwd, projectName)

  try {
    await execa("pnpm", ["approve-builds", "--all"], { cwd: projectPath })
    spinner.succeed("Approved builds for " + chalk.blue(projectName))
    return true
  } catch {
    spinner.fail("Failed to approve builds for " + chalk.blue(projectName))
    return false
  }
}

async function bunApproveBuilds(projectName: string, cwd: string) {
  const spinner = ora("Approving builds for " + chalk.blue(projectName)).start()
  const projectPath = join(cwd, projectName)

  try {
    const result = await execa("bun", ["pm", "trust", "--all"], {
      cwd: projectPath,
      reject: false,
    })

    // bun exits with code 1 when the dependencies were already trusted
    // (e.g. via trustedDependencies pre-set during package manager config).
    const alreadyTrusted = /already trusted|0 scripts ran/i.test(result.stderr ?? "")

    if (result.exitCode !== 0 && !alreadyTrusted) {
      throw new Error(result.stderr || `bun pm trust exited with code ${result.exitCode}`)
    }

    spinner.succeed("Approved builds for " + chalk.blue(projectName))
    return true
  } catch {
    spinner.fail("Failed to approve builds for " + chalk.blue(projectName))
    return false
  }
}
