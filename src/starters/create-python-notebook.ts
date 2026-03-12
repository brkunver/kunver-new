import { join, dirname } from "path"
import { existsSync } from "fs"
import { fileURLToPath } from "url"
import { execa } from "execa"

import { copyTemplateFolder } from "@/helpers"

type ProjectOptions = {
  name: string
  cwd?: string
}

function getDirname() {
  if (typeof __dirname !== "undefined") {
    return __dirname
  }

  if (typeof import.meta !== "undefined" && import.meta.url) {
    return dirname(fileURLToPath(import.meta.url))
  }

  return process.cwd()
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

  await execa("uv", ["sync"], {
    cwd: projectPath,
    stdout: "inherit",
    stderr: "inherit",
  })
}
