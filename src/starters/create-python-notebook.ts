import { join } from "node:path"
import fs from "node:fs"

type projectOptions = {
  name: string
  cwd?: string
}

// create python notebook project
export async function createPythonNotebookProject(options: projectOptions) {
  const { name, cwd = process.cwd() } = options
  // create project folder then create main.ipynb file
  const projectPath = join(cwd, name)
  if (!fs.existsSync(projectPath)) {
    fs.mkdirSync(projectPath)
  }
  const mainPath = join(projectPath, "main.ipynb")
  fs.writeFileSync(mainPath, "")
}
