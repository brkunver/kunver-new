import { beforeEach, describe, expect, it, vi } from "vitest"

const execaMock = vi.fn()
const helperMocks = vi.hoisted(() => ({
  copyTemplateFolder: vi.fn(),
}))

vi.mock("execa", () => ({
  execa: execaMock,
}))

vi.mock("@/helpers", () => ({
  copyTemplateFolder: helperMocks.copyTemplateFolder,
}))

import { createPythonNotebookProject } from "@/starters/create-python-notebook"

describe("createPythonNotebookProject", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    helperMocks.copyTemplateFolder.mockResolvedValue(true)
    execaMock.mockResolvedValue({})
  })

  it("copies the uv notebook template and runs uv sync", async () => {
    await createPythonNotebookProject({
      name: "uv-notebook-app",
      cwd: "/workspace",
    })

    expect(helperMocks.copyTemplateFolder).toHaveBeenCalledWith(
      expect.stringContaining("uv-notebook"),
      "/workspace/uv-notebook-app",
    )
    expect(execaMock).toHaveBeenCalledWith("uv", ["sync"], {
      cwd: "/workspace/uv-notebook-app",
      stdout: "inherit",
      stderr: "inherit",
    })
  })

  it("throws when the uv notebook template cannot be copied", async () => {
    helperMocks.copyTemplateFolder.mockResolvedValue(false)

    await expect(
      createPythonNotebookProject({
        name: "uv-notebook-app",
        cwd: "/workspace",
      }),
    ).rejects.toThrow("Failed to copy uv notebook template")

    expect(execaMock).not.toHaveBeenCalled()
  })
})
