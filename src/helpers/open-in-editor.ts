import path from "node:path"
import { input } from "@inquirer/prompts"
import chalk from "chalk"
import { spawn } from "node:child_process"
// after everything, ask user to open the project in their editor

type editorName = "code" | "windsurf" | "cursor"

export async function openInEditor(name: string, cwd: string, editorName: editorName) {
  const projectPath = path.join(cwd, name)

  return new Promise(resolve => {
    const child = spawn(`${editorName} ${projectPath}`, { shell: true, cwd: cwd })
    child.on("close", () => resolve(true))
  })
}
