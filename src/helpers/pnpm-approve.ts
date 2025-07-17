import { spawn } from "node:child_process"
import ora from "ora"

export async function approveBuilds(projectName: string) {
  return new Promise(resolve => {
    const command = "cd " + projectName + " && pnpm approve-builds"
    const child = spawn(command, { shell: true, cwd: process.cwd() })
    const spinner = ora("Approving builds").start()
    
    child.stdout.pipe(process.stdout)
    child.stderr.pipe(process.stderr)
    child.on("close", code => {
      if (code === 0) {
        spinner.succeed("Builds approved.")
      } else {
        spinner.fail("Failed to approve builds.")
      }
      resolve(true)
    })
  })
}
