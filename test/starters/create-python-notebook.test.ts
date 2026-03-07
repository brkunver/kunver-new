import { mkdir, writeFile } from "fs/promises"

import { beforeEach, describe, expect, it, vi } from "vitest"

const execaMock = vi.fn()

vi.mock("execa", () => ({
  execa: execaMock,
}))

vi.mock("fs/promises", async importOriginal => {
  const actual = await importOriginal<typeof import("fs/promises")>()

  return {
    ...actual,
    mkdir: vi.fn(),
    writeFile: vi.fn(),
  }
})

import { createPythonNotebookProject } from "@/starters/create-python-notebook"

describe("createPythonNotebookProject", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    execaMock.mockResolvedValue({})
  })

  it("initializes a uv project, installs numpy, and writes a valid notebook", async () => {
    await createPythonNotebookProject({
      name: "uv-notebook-app",
      cwd: "/workspace",
    })

    expect(mkdir).toHaveBeenCalledWith("/workspace/uv-notebook-app", { recursive: true })
    expect(execaMock).toHaveBeenNthCalledWith(1, "uv", ["init", "--python", "3.12"], {
      cwd: "/workspace/uv-notebook-app",
      stdout: "inherit",
      stderr: "inherit",
    })
    expect(execaMock).toHaveBeenNthCalledWith(2, "uv", ["add", "numpy"], {
      cwd: "/workspace/uv-notebook-app",
      stdout: "inherit",
      stderr: "inherit",
    })

    expect(writeFile).toHaveBeenCalledTimes(1)

    const [filePath, notebookContent, encoding] = vi.mocked(writeFile).mock.calls[0]

    expect(filePath).toBe("/workspace/uv-notebook-app/main.ipynb")
    expect(encoding).toBe("utf8")

    const notebook = JSON.parse(notebookContent as string)

    expect(notebook).toMatchObject({
      nbformat: 4,
      nbformat_minor: 5,
      metadata: {
        kernelspec: {
          display_name: "Python 3.12",
        },
        language_info: {
          version: "3.12",
        },
      },
    })

    expect(notebook.cells).toHaveLength(2)
    expect(notebook.cells[0]).toMatchObject({
      cell_type: "markdown",
      metadata: {
        language: "markdown",
      },
    })
    expect(notebook.cells[1]).toMatchObject({
      cell_type: "code",
      metadata: {
        language: "python",
      },
      outputs: [],
    })
    expect(notebook.cells[1].source).toContain("import numpy as np\n")
  })
})
