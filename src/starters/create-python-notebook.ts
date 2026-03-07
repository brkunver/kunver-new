import { join } from "path"
import { mkdir, writeFile } from "fs/promises"
import { execa } from "execa"

type ProjectOptions = {
  name: string
  cwd?: string
}

export async function createPythonNotebookProject(options: ProjectOptions) {
  const { name, cwd = process.cwd() } = options
  const projectPath = join(cwd, name)
  const mainPath = join(projectPath, "main.ipynb")

  await mkdir(projectPath, { recursive: true })

  await execa("uv", ["init", "--python", "3.12"], {
    cwd: projectPath,
    stdout: "inherit",
    stderr: "inherit",
  })

  await execa("uv", ["add", "numpy"], {
    cwd: projectPath,
    stdout: "inherit",
    stderr: "inherit",
  })

  await writeFile(mainPath, createNotebookContent(name), "utf8")
}

function createNotebookContent(projectName: string) {
  return `${JSON.stringify(
    {
      cells: [
        {
          cell_type: "markdown",
          metadata: {
            language: "markdown",
          },
          source: [`# ${projectName}\n`, "\n", "Starter notebook with NumPy ready to use.\n"],
        },
        {
          cell_type: "code",
          execution_count: null,
          metadata: {
            language: "python",
          },
          outputs: [],
          source: ["import numpy as np\n", "np.arange(5)\n"],
        },
      ],
      metadata: {
        kernelspec: {
          display_name: "Python 3.12",
          language: "python",
          name: "python3",
        },
        language_info: {
          name: "python",
          version: "3.12",
        },
      },
      nbformat: 4,
      nbformat_minor: 5,
    },
    null,
    2,
  )}\n`
}
