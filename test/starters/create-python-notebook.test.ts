import { beforeEach, describe, expect, it, vi } from "vitest"
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

import { createPythonNotebookProject } from "@/starters/create-python-notebook"

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
})
