import { access, mkdtemp, mkdir, readFile, rm, writeFile } from "fs/promises"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("@/helpers/utils", () => ({
  getDirname: vi.fn(() => "/mock/templates"),
}))

import { configurePackageManager } from "@/helpers"

const createdPaths: string[] = []

async function makeProject(packageManager: string) {
  const cwd = await mkdtemp(join(tmpdir(), "kunver-new-test-"))
  const projectName = `${packageManager}-app`
  const projectPath = join(cwd, projectName)

  createdPaths.push(cwd)

  await mkdir(projectPath, { recursive: true })
  await writeFile(
    join(projectPath, "package.json"),
    JSON.stringify({ name: projectName, scripts: { dev: "vite" } }, null, 2),
    "utf-8",
  )

  return { cwd, projectName, projectPath }
}

afterEach(async () => {
  await Promise.all(createdPaths.splice(0).map(directoryPath => rm(directoryPath, { recursive: true, force: true })))
})

describe("configurePackageManager", () => {
  it("writes a pnpm manager script", async () => {
    const { projectPath } = await makeProject("pnpm")

    await configurePackageManager("pnpm", projectPath)

    const packageJson = JSON.parse(await readFile(join(projectPath, "package.json"), "utf-8"))
    expect(packageJson.scripts).toMatchObject({
      dev: "vite",
      manager: "node manager.cjs pnpm",
    })
  })

  it("writes a bun manager script for bun projects", async () => {
    const { projectPath } = await makeProject("bun")

    await configurePackageManager("bun", projectPath)

    const packageJson = JSON.parse(await readFile(join(projectPath, "package.json"), "utf-8"))
    expect(packageJson.scripts.manager).toBe("bun manager.cjs bun")
  })

  it("keeps pnpm workspace config for pnpm projects", async () => {
    const { projectPath } = await makeProject("pnpm")
    await writeFile(join(projectPath, "pnpm-workspace.yaml"), "allowBuilds:\n  esbuild: true\n", "utf-8")

    await configurePackageManager("pnpm", projectPath)

    await expect(access(join(projectPath, "pnpm-workspace.yaml"))).resolves.toBeUndefined()
  })

  it("translates pnpm build approvals to bun trusted dependencies", async () => {
    const { projectPath } = await makeProject("bun")
    await writeFile(join(projectPath, "pnpm-workspace.yaml"), "allowBuilds:\n  esbuild: true\n", "utf-8")

    await configurePackageManager("bun", projectPath)

    const packageJson = JSON.parse(await readFile(join(projectPath, "package.json"), "utf-8"))
    expect(packageJson.trustedDependencies).toEqual(["esbuild"])
    await expect(access(join(projectPath, "pnpm-workspace.yaml"))).rejects.toThrow()
  })
})
