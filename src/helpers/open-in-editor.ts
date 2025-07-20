import { execa } from "execa"
import chalk from "chalk"

type editorName = "code" | "windsurf" | "cursor"

export async function openInEditor(projectName: string, cwd: string, editorName: editorName) {
  console.log(chalk.white("Opening " + chalk.blue(projectName) + " in " + chalk.green(editorName)))
  try {
    await execa(`${editorName} ${projectName}`, { shell: true, cwd: cwd })
    return true
  } catch (error) {
    console.error(chalk.red("Failed to open project in editor:"), error)
    return false
  }
}
