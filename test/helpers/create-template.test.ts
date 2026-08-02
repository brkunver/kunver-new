import { access, mkdtemp, mkdir, rm, writeFile } from "fs/promises"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const helperMocks = vi.hoisted(() => ({
  copyTemplateFolder: vi.fn(),
  installDependencies: vi.fn(),
  approveBuilds: vi.fn(),
  configurePackageManager: vi.fn(),
  changeProjectName: vi.fn(),
}))

vi.mock("@/helpers", () => ({
  copyTemplateFolder: helperMocks.copyTemplateFolder,
  installDependencies: helperMocks.installDependencies,
  approveBuilds: helperMocks.approveBuilds,
  configurePackageManager: helperMocks.configurePackageManager,
  changeProjectName: helperMocks.changeProjectName,
}))

vi.mock("@/helpers/utils", async importOriginal => {
  const actual = await importOriginal<typeof import("@/helpers/utils")>()
  return {
    ...actual,
    getDirname: vi.fn(() => "/mock/templates"),
  }
})

import { createTemplateProject } from "@/helpers/create-template"

const createdPaths: string[] = []

async function makeCwd() {
  const cwd = await mkdtemp(join(tmpdir(), "kunver-new-create-test-"))
  createdPaths.push(cwd)
  return cwd
}

afterEach(async () => {
  await Promise.all(createdPaths.splice(0).map(directoryPath => rm(directoryPath, { recursive: true, force: true })))
})

describe("createTemplateProject", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    helperMocks.copyTemplateFolder.mockResolvedValue(true)
    helperMocks.installDependencies.mockResolvedValue(true)
    helperMocks.approveBuilds.mockResolvedValue(true)
    helperMocks.configurePackageManager.mockResolvedValue(true)
    helperMocks.changeProjectName.mockResolvedValue(true)
  })

  it("removes the project folder when a step fails", async () => {
    const cwd = await makeCwd()
    const name = "my-app"
    const projectPath = join(cwd, name)

    helperMocks.copyTemplateFolder.mockImplementation(async () => {
      await mkdir(projectPath, { recursive: true })
      return true
    })
    helperMocks.configurePackageManager.mockRejectedValue(new Error("boom"))

    await expect(
      createTemplateProject({ templateName: "react-ts-tw", name, packageManager: "pnpm", cwd }),
    ).rejects.toThrow("boom")

    await expect(access(projectPath)).rejects.toThrow()
  })

  it("keeps a pre-existing folder untouched on failure", async () => {
    const cwd = await makeCwd()
    const name = "my-app"
    const projectPath = join(cwd, name)

    await mkdir(projectPath, { recursive: true })
    await writeFile(join(projectPath, "keep.txt"), "data", "utf-8")

    helperMocks.copyTemplateFolder.mockResolvedValue(true)
    helperMocks.configurePackageManager.mockRejectedValue(new Error("boom"))

    await expect(
      createTemplateProject({ templateName: "react-ts-tw", name, packageManager: "pnpm", cwd }),
    ).rejects.toThrow("boom")

    await expect(access(join(projectPath, "keep.txt"))).resolves.toBeUndefined()
  })
})
