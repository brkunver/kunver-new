// tests/wxt-tests/wxt.test.ts
import path from "node:path"
import fs from "node:fs/promises"
import { beforeAll, afterAll, describe, expect, it } from "vitest"
import { createTempDir, removeTempDir } from "../tools/tempdir"
import { createWxtProject } from "../../src/starters/create-wxt"
import { packageManagers } from "../../src/project-starter"

// Helper functions for file system operations
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function readFileSafe(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, "utf-8")
  } catch (error) {
    throw new Error(`Failed to read file at ${filePath}: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// Test configuration
describe.each(packageManagers)(`WXT Svelte project with %s`, packageManager => {
  const projectName = "testing-wxt-with-" + packageManager
  let tempDir: string
  let projectPath: string

  beforeAll(async () => {
    const tempDirPath = await createTempDir()
    if (!tempDirPath) {
      throw new Error("Failed to create temporary directory")
    }

    tempDir = tempDirPath
    projectPath = path.join(tempDir, projectName)

    // Create the project before all tests
    await createWxtProject({
      name: projectName,
      packageManager,
      cwd: tempDir,
    })
  }, 120000) // 2 minutes timeout for wxt installation

  afterAll(async () => {
    try {
      await removeTempDir(tempDir)
    } catch (error) {
      console.error("Error cleaning up temporary directory:", error)
    }
  })

  it("should create the project directory structure", async () => {
    const requiredDirs = ["src", "src/entrypoints", "src/assets", "node_modules"]

    for (const dir of requiredDirs) {
      const dirPath = path.join(projectPath, dir)
      await expect(fileExists(dirPath), `${dir} directory should exist`).resolves.toBe(true)
    }
  })

  it("should install all required dependencies", async () => {
    const packageJsonPath = path.join(projectPath, "package.json")
    const packageJson = JSON.parse(await readFileSafe(packageJsonPath))

    // Check for required dependencies
    const requiredDeps = ["wxt", "svelte", "tailwindcss", "@tailwindcss/vite"]

    requiredDeps.forEach(dep => {
      expect(
        packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep],
        `${dep} should be installed`,
      ).toBeDefined()
    })
  })

  it("should have all required configuration files", async () => {
    const requiredConfigs = [".prettierrc.json", "wxt.config.ts", "tsconfig.json", "push.sh"]

    const configChecks = await Promise.all(
      requiredConfigs.map(async config => ({
        name: config,
        exists: await fileExists(path.join(projectPath, config)),
      })),
    )

    configChecks.forEach(({ name, exists }) => {
      expect(exists, `${name} should exist`).toBe(true)
    })
  })

  it("should configure wxt.config.ts with Tailwind plugin", async () => {
    const wxtConfigPath = path.join(projectPath, "wxt.config.ts")
    const wxtConfig = await readFileSafe(wxtConfigPath)

    // Check for Tailwind imports and configuration
    expect(wxtConfig).toContain('import tailwindcss from "@tailwindcss/vite"')
    expect(wxtConfig).toContain("plugins: [tailwindcss()]")
  })

  it("should clean up unnecessary files", async () => {
    const deletedFiles = ["src/assets/svelte.svg", "src/entrypoints/popup/app.css", "src/entrypoints/content.ts", "src/lib/Counter.svelte"]

    const deletionChecks = await Promise.all(
      deletedFiles.map(async file => ({
        name: file,
        exists: await fileExists(path.join(projectPath, file)),
      })),
    )

    deletionChecks.forEach(({ name, exists }) => {
      expect(exists, `${name} should not exist`).toBe(false)
    })
  })

  it("should have the correct popup App component structure", async () => {
    const appPath = path.join(projectPath, "src/entrypoints/popup/App.svelte")
    const appContent = await readFileSafe(appPath)

    // Check for basic structure
    expect(appContent).toContain('<h1 class="text-3xl">{message}</h1>')
  })

  it("should have the correct content script files", async () => {
    const contentAppPath = path.join(projectPath, "src/entrypoints/content/App.svelte")
    const contentIndexPath = path.join(projectPath, "src/entrypoints/content/index.ts")

    await expect(fileExists(contentAppPath), `content App.svelte should exist`).resolves.toBe(true)
    await expect(fileExists(contentIndexPath), `content index.ts should exist`).resolves.toBe(true)

    const appContent = await readFileSafe(contentAppPath)
    expect(appContent).toContain('<h1 class="text-3xl fixed top-20 left-20 z-50">{message}</h1>')

    const indexContent = await readFileSafe(contentIndexPath)
    expect(indexContent).toContain('export default defineContentScript({')
  })

  it("should have Tailwind CSS import in main.ts and tailwind.css file", async () => {
    const mainTsPath = path.join(projectPath, "src/entrypoints/popup/main.ts")
    const mainTsContent = await readFileSafe(mainTsPath)

    expect(mainTsContent).toContain('import "~/assets/tailwind.css"')

    const tailwindCssPath = path.join(projectPath, "src/assets/tailwind.css")
    const tailwindCssContent = await readFileSafe(tailwindCssPath)

    expect(tailwindCssContent.trim()).toBe('@import "tailwindcss";')
  })
})
