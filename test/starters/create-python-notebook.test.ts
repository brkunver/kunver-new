import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { access, mkdtemp, mkdir, rm } from "fs/promises"
import { tmpdir } from "os"
import { join } from "path"

const mocks = vi.hoisted(() => ({
  execa: vi.fn(),
  copyTemplateFolder: vi.fn(),
}))

vi.mock("execa", () => ({
  execa: mocks.execa,
}))

vi.mock("@/helpers", () => ({
  copyTemplateFolder: mocks.copyTemplateFolder,
}))

vi.mock("@/helpers/utils", async importOriginal => {
  const actual = await importOriginal<typeof import("@/helpers/utils")>()
  return {
    ...actual,
    getDirname: vi.fn(() => "/mock/templates"),
  }
})

import { createPythonNotebookProject } from "@/starters/create-python-notebook"

const createdPaths: string[] = []

afterEach(async () => {
  await Promise.all(createdPaths.splice(0).map(directoryPath => rm(directoryPath, { recursive: true, force: true })))
})

describe("createPythonNotebookProject", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.copyTemplateFolder.mockResolvedValue(true)
    mocks.execa.mockResolvedValue({})
  })

  it("copies the uv notebook template and runs uv sync", async () => {
    await createPythonNotebookProject({
      name: "uv-notebook-app",
      cwd: "/workspace",
    })

    expect(mocks.copyTemplateFolder).toHaveBeenCalledWith(
      expect.stringContaining("uv-notebook"),
      join("/workspace", "uv-notebook-app"),
    )
    expect(mocks.execa).toHaveBeenCalledWith("uv", ["sync"], {
      cwd: join("/workspace", "uv-notebook-app"),
      stdout: "inherit",
      stderr: "inherit",
    })
  })

  it("throws when the uv notebook template cannot be copied", async () => {
    mocks.copyTemplateFolder.mockResolvedValue(false)

    await expect(
      createPythonNotebookProject({
        name: "uv-notebook-app",
        cwd: "/workspace",
      }),
    ).rejects.toThrow("Failed to copy uv notebook template")

    expect(mocks.execa).not.toHaveBeenCalled()
  })

  it("removes the project folder when uv sync fails", async () => {
    const workspaceRoot = await mkdtemp(join(tmpdir(), "kunver-new-notebook-test-"))
    createdPaths.push(workspaceRoot)
    const projectPath = join(workspaceRoot, "uv-notebook-app")

    mocks.copyTemplateFolder.mockImplementation(async () => {
      await mkdir(projectPath, { recursive: true })
      return true
    })
    mocks.execa.mockRejectedValue(new Error("uv failed"))

    await expect(
      createPythonNotebookProject({
        name: "uv-notebook-app",
        cwd: workspaceRoot,
      }),
    ).rejects.toThrow("uv failed")

    await expect(access(projectPath)).rejects.toThrow()
  })
})
