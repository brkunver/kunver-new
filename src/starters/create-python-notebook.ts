import { join } from "path"
import { existsSync } from "fs"
import { execa } from "execa"
import chalk from "chalk"

import { copyTemplateFolder } from "@/helpers"
import { getDirname } from "@/helpers/utils"

type ProjectOptions = {
  name: string
  cwd?: string
}

const currentDir = getDirname()

function resolveTemplatePath(templateName: string) {
  const devTemplatePath = join(currentDir, "../public/templates", templateName)
  const prodTemplatePath = join(currentDir, "templates", templateName)

  return existsSync(devTemplatePath) ? devTemplatePath : prodTemplatePath
}

export async function createPythonNotebookProject(options: ProjectOptions) {
  const { name, cwd = process.cwd() } = options
  const projectPath = join(cwd, name)
  const templatePath = resolveTemplatePath("uv-notebook")

  const copied = await copyTemplateFolder(templatePath, projectPath)

  if (!copied) {
    throw new Error("Failed to copy uv notebook template")
  }

  try {
    await execa("uv", ["sync"], {
      cwd: projectPath,
      stdout: "inherit",
      stderr: "inherit",
    })
  } catch (error) {
    console.error(chalk.red("Failed to sync uv dependencies."))
    console.error(
      chalk.yellow("Please ensure 'uv' is installed: https://docs.astral.sh/uv/getting-started/installation/"),
    )
    throw error
  }
}
