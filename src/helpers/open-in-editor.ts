import { spawn } from "node:child_process"
import chalk from "chalk"

type editorName = "code" | "windsurf" | "cursor"

export async function openInEditor(projectName: string, cwd: string, editorName: editorName) {
  console.log(chalk.blue(`Opening ${projectName} in ${editorName}`))
  return new Promise(resolve => {
    const child = spawn(`${editorName} ${projectName}`, { shell: true, cwd: cwd })
    child.on("close", () => resolve(true))
  })
}
