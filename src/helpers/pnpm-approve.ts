import { execa } from "execa"
import ora from "ora"

export async function pnpmApproveBuilds(projectName: string, cwd: string) {
  const command = "cd " + projectName + " && pnpm approve-builds"
  const spinner = ora("Approving builds").start()

  try {
    await execa(command, { shell: true, cwd: cwd, stdio: 'inherit', input: 'a\ny' })
    spinner.succeed("Builds approved.")
    return true
  } catch (error) {
    spinner.fail("Failed to approve builds.")
    console.error(error)
    return false
  }
}
