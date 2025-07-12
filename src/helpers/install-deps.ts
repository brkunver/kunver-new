// src/helpers/install-deps.ts

import { spawn } from "node:child_process"

export function installDependencies(packageManager: string, name: string): Promise<boolean> {
  return new Promise((resolve) => {
    let command: string

    switch (packageManager) {
      case "pnpm":
        command = `cd ${name} && pnpm install`
        break
      case "npm":
        command = `cd ${name} && npm install`
        break
      case "bun":
        command = `cd ${name} && bun install`
        break
      default:
        command = `cd ${name} && pnpm install`
    }

    const child = spawn(command, { shell: true, cwd: process.cwd() })
    console.log(`Installing dependencies, path: ${process.cwd()}`)

    child.stdout.pipe(process.stdout)
    child.stderr.pipe(process.stderr)

    child.on("close", (code) => {
      if (code === 0) {
        console.log(`✅ Installed dependencies for ${name}`)
        resolve(true)
      } else {
        console.error(`❌ Failed to install dependencies for ${name}`)
        resolve(false)
      }
    })
  })
}
