import { spawn } from "node:child_process"

export function approveBuilds() {
  const child = spawn("pnpm approve-builds", { shell: true })
  child.stdout.pipe(process.stdout)
  child.stderr.pipe(process.stderr)

  child.stdin.write("a\n")
  child.stdin.write("y\n")

  child.on("close", code => {
    if (code === 0) {
      console.log("✅ Builds approved.")
    } else {
      console.error("❌ Failed to approve builds.")
    }
  })
}
