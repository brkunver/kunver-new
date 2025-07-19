// tests/react-tests/react.test.ts
import path from "node:path"
import fs from "node:fs/promises"
import { beforeAll, afterAll, describe, expect, it } from "vitest"
import { createTempDir, removeTempDir } from "../tools/tempdir"
import { createReactProject } from "../../src/starters/create-react"
import { packageManagers } from "../../src/project-starter"

// Helper functions for file system operations
async function fileExists(filePath: string): Promise<boolean> {
  return fs
    .access(filePath)
    .then(() => true)
    .catch(() => false)
}

async function readFileSafe(filePath: string): Promise<string> {
  return fs.readFile(filePath, "utf-8")
}

describe.each(packageManagers)(`React project with %s`, packageManager => {
  const projectName = "testing-react"
  let tempDir: string
  let projectPath = ""

  beforeAll(async () => {
    const getTempDir = await createTempDir()
    if (!getTempDir) {
      process.exit(1)
    }
    tempDir = getTempDir
    projectPath = path.join(tempDir, projectName)
  })

  afterAll(async () => {
    await removeTempDir(tempDir)
  })

  it("should create project", async () => {
    await createReactProject({ name: projectName, packageManager, cwd: tempDir })
    expect(await fileExists(projectPath)).toBe(true)
  })

  it("should install dependencies", async () => {
    expect(await fileExists(path.join(projectPath, "node_modules"))).toBe(true)
  })

  it("should have config files", async () => {
    const hasPrettier = await fileExists(path.join(projectPath, ".prettierrc.json"))
    const hasPush = await fileExists(path.join(projectPath, "push.sh"))
    expect(hasPrettier && hasPush).toBe(true)
  })

  it("should include tailwind import", async () => {
    const viteConfig = await readFileSafe(path.join(projectPath, "vite.config.ts"))
    expect(viteConfig).toContain('import tailwindcss from "@tailwindcss/vite"')
  })

  it("should include tailwind plugin", async () => {
    const viteConfig = await readFileSafe(path.join(projectPath, "vite.config.ts"))
    expect(viteConfig).toContain("tailwindcss()")
  })

  it("should add tailwind directive", async () => {
    const css = await readFileSafe(path.join(projectPath, "src/index.css"))
    expect(css).toContain('@import "tailwindcss";')
  })

  it("should delete app.css", async () => {
    expect(await fileExists(path.join(projectPath, "src/app.css"))).toBe(false)
  })

  it("should delete assets", async () => {
    expect(await fileExists(path.join(projectPath, "src/assets"))).toBe(false)
  })

  it("should delete eslint.config.js", async () => {
    expect(await fileExists(path.join(projectPath, "eslint.config.js"))).toBe(false)
  })

  it("should clear app.tsx", async () => {
    const content = await readFileSafe(path.join(projectPath, "src/app.tsx"))
    expect(content).toContain(`<h1 className="text-3xl font-bold underline">Hello</h1>`)
  })
})
