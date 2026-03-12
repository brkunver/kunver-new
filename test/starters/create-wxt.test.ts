import { mkdtemp, mkdir, readFile, rm, writeFile } from "fs/promises"
import { tmpdir } from "os"
import { join } from "path"

import { beforeEach, afterEach, describe, expect, it, vi } from "vitest"

const promptMocks = vi.hoisted(() => ({
  select: vi.fn(),
  confirm: vi.fn(),
}))

const helperMocks = vi.hoisted(() => ({
  createTemplateProject: vi.fn(),
}))

vi.mock("@inquirer/prompts", () => ({
  select: promptMocks.select,
  confirm: promptMocks.confirm,
}))

vi.mock("@/helpers", () => ({
  createTemplateProject: helperMocks.createTemplateProject,
}))

import { createWxtProject } from "@/starters/create-wxt"

const createdPaths: string[] = []

async function makeTempDir() {
  const directoryPath = await mkdtemp(join(tmpdir(), "kunver-new-wxt-test-"))
  createdPaths.push(directoryPath)
  return directoryPath
}

afterEach(async () => {
  await Promise.all(createdPaths.splice(0).map(directoryPath => rm(directoryPath, { recursive: true, force: true })))
})

describe("createWxtProject", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("adds storage permission and example file when wxt-storage is enabled", async () => {
    const workspaceRoot = await makeTempDir()

    promptMocks.confirm.mockResolvedValueOnce(false).mockResolvedValueOnce(true)
    helperMocks.createTemplateProject.mockImplementationOnce(async ({ name, onBeforeInstall }) => {
      const projectPath = join(workspaceRoot, name)

      await mkdir(projectPath, { recursive: true })
      await writeFile(
        join(projectPath, "wxt.config.ts"),
        `import { defineConfig } from "wxt"

export default defineConfig({
  manifest: {
    name: "demo",
    description: "manifest.json description",
  },
})
`,
        "utf-8",
      )
      await writeFile(join(projectPath, "package.json"), '{"devDependencies":{}}', "utf-8")

      await onBeforeInstall?.(projectPath)
    })

    await createWxtProject({
      name: "demo-extension",
      packageManager: "bun",
      selectedFramework: "vanilla",
    })

    const projectPath = join(workspaceRoot, "demo-extension")
    const wxtConfig = await readFile(join(projectPath, "wxt.config.ts"), "utf-8")
    const storageExample = await readFile(join(projectPath, "utils", "storage.ts"), "utf-8")

    expect(wxtConfig).toContain('permissions: ["storage"]')
    expect(storageExample).toContain('// import { storage } from "#imports"')
    expect(storageExample).toContain("//   fallback: true,")
    expect(promptMocks.confirm).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        message: expect.any(String),
        default: false,
      }),
    )
  })

  it("leaves the project unchanged when wxt-storage is disabled", async () => {
    const workspaceRoot = await makeTempDir()

    promptMocks.confirm.mockResolvedValueOnce(false).mockResolvedValueOnce(false)
    helperMocks.createTemplateProject.mockImplementationOnce(async ({ name, onBeforeInstall }) => {
      const projectPath = join(workspaceRoot, name)

      await mkdir(projectPath, { recursive: true })
      await writeFile(
        join(projectPath, "wxt.config.ts"),
        `import { defineConfig } from "wxt"

export default defineConfig({
  manifest: {
    name: "demo",
    description: "manifest.json description",
  },
})
`,
        "utf-8",
      )
      await writeFile(join(projectPath, "package.json"), '{"devDependencies":{}}', "utf-8")

      await onBeforeInstall?.(projectPath)
    })

    await createWxtProject({
      name: "demo-extension",
      packageManager: "bun",
      selectedFramework: "vanilla",
    })

    const projectPath = join(workspaceRoot, "demo-extension")
    const wxtConfig = await readFile(join(projectPath, "wxt.config.ts"), "utf-8")

    expect(wxtConfig).not.toContain('permissions: ["storage"]')
    await expect(readFile(join(projectPath, "utils", "storage.ts"), "utf-8")).rejects.toThrow()
  })
})
