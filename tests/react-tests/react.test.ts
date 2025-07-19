// tests/react-tests/react.test.ts
import path from "node:path"
import fs from "node:fs/promises"
import { beforeAll, afterAll, describe, expect, it } from "vitest"
import { createTempDir, removeTempDir } from "../tools/tempdir"
import { createReactProject } from "../../src/starters/create-react"
import { packageManagers } from "../../src/project-starter"

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
    const exists = await fs
      .access(projectPath)
      .then(() => true)
      .catch(() => false)
    expect(exists).toBe(true)
  })

  it("should install dependencies", async () => {
    const exists = await fs
      .access(path.join(projectPath, "node_modules"))
      .then(() => true)
      .catch(() => false)
    expect(exists).toBe(true)
  })

  it("should have config files", async () => {
    const hasPrettier = await fs
      .access(path.join(projectPath, ".prettierrc.json"))
      .then(() => true)
      .catch(() => false)
    const hasPush = await fs
      .access(path.join(projectPath, "push.sh"))
      .then(() => true)
      .catch(() => false)
    expect(hasPrettier && hasPush).toBe(true)
  })

  it("should include tailwind import", async () => {
    const viteConfig = await fs.readFile(path.join(projectPath, "vite.config.ts"), "utf-8")
    expect(viteConfig.includes('import tailwindcss from "@tailwindcss/vite"')).toBe(true)
  })

  it("should include tailwind plugin", async () => {
    const viteConfig = await fs.readFile(path.join(projectPath, "vite.config.ts"), "utf-8")
    expect(viteConfig.includes("tailwindcss()")).toBe(true)
  })

  it("should add tailwind directive", async () => {
    const css = await fs.readFile(path.join(projectPath, "src/index.css"), "utf-8")
    expect(css.includes('@import "tailwindcss";')).toBe(true)
  })

  it("should delete app.css", async () => {
    const exists = await fs
      .access(path.join(projectPath, "src/app.css"))
      .then(() => true)
      .catch(() => false)
    expect(exists).toBe(false)
  })

  it("should delete assets", async () => {
    const exists = await fs
      .access(path.join(projectPath, "src/assets"))
      .then(() => true)
      .catch(() => false)
    expect(exists).toBe(false)
  })

  it("should delete eslint.config.js", async () => {
    const exists = await fs
      .access(path.join(projectPath, "eslint.config.js"))
      .then(() => true)
      .catch(() => false)
    expect(exists).toBe(false)
  })

  it("should clear app.tsx", async () => {
    const content = await fs.readFile(path.join(projectPath, "src/app.tsx"), "utf-8")
    expect(content.includes(`<h1 className="text-3xl font-bold underline">Hello</h1>`)).toBe(true)
  })
})
