import { spawn } from "node:child_process"
import ora from "ora"

export async function pnpmApproveBuilds(projectName: string, cwd: string) {
  return new Promise((resolve, reject) => {
    const command = "cd " + projectName + " && pnpm approve-builds"
    const child = spawn(command, { shell: true, cwd: cwd })
    const spinner = ora("Approving builds").start()

    child.stdout.pipe(process.stdout)
    child.stderr.pipe(process.stderr)

    setTimeout(() => {
      child.stdin.write("a\n")
      setTimeout(() => {
        child.stdin.write("y\n")
        child.stdin.end()
      }, 500)
    }, 500)

    child.on("close", code => {
      if (code === 0) {
        spinner.succeed("Builds approved.")
        resolve(true)
      } else {
        spinner.fail("Failed to approve builds.")
        reject(new Error(`Process exited with code ${code}`))
      }
    })

    child.on("error", err => {
      spinner.fail(`Failed to start process. Error: ${err.message}`)
      reject(err)
    })
  })
}
