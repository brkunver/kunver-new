import { spawn } from "node:child_process"
import ora from "ora"

export async function approveBuilds() {
  return new Promise(resolve => {
    const child = spawn("pnpm approve-builds", { shell: true })
    const spinner = ora("Approving builds").start()
    spinner.color = "blue"
    child.stdout.pipe(process.stdout)
    child.stderr.pipe(process.stderr)
    // wait for 500ms
    setTimeout(() => {
      child.stdin.write("a")
      child.stdin.write("y")
    }, 500)
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
