import { join } from "path"
import { mkdir, writeFile, access } from "fs/promises"
import { constants } from "fs"

type ProjectOptions = {
  name: string
  cwd?: string
}

// create python notebook project
export async function createPythonNotebookProject(options: ProjectOptions) {
  const { name, cwd = process.cwd() } = options
  const projectPath = join(cwd, name)

  try {
    // Check if directory exists
    await access(projectPath, constants.F_OK)
  } catch {
    // Directory doesn't exist, create it
    await mkdir(projectPath, { recursive: true })
  }

  const mainPath = join(projectPath, "main.ipynb")
  await writeFile(mainPath, "")
}
