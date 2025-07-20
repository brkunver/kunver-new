// tests/react-tests/react.test.ts
import path from "node:path"
import fs from "node:fs/promises"
import { beforeAll, afterAll, describe, expect, it } from "vitest"
import { createTempDir, removeTempDir } from "../tools/tempdir"
import { createReactProject } from "../../src/starters/create-react"
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
describe.each(packageManagers)(`React project with %s`, packageManager => {
  const projectName = "testing-react-with " + packageManager
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
    await createReactProject({
      name: projectName,
      packageManager,
      cwd: tempDir,
    })
  })

  afterAll(async () => {
    try {
      await removeTempDir(tempDir)
    } catch (error) {
      console.error("Error cleaning up temporary directory:", error)
    }
  })

  it("should create the project directory structure", async () => {
    const requiredDirs = ["src", "public", "node_modules"]

    for (const dir of requiredDirs) {
      const dirPath = path.join(projectPath, dir)
      await expect(fileExists(dirPath), `${dir} directory should exist`).resolves.toBe(true)
    }
  })

  it("should install all required dependencies", async () => {
    const packageJsonPath = path.join(projectPath, "package.json")
    const packageJson = JSON.parse(await readFileSafe(packageJsonPath))

    // Check for required dependencies
    const requiredDeps = ["react", "react-dom", "@tailwindcss/vite", "tailwindcss"]

    requiredDeps.forEach(dep => {
      expect(
        packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep],
        `${dep} should be installed`,
      ).toBeDefined()
    })
  })

  it("should have all required configuration files", async () => {
    const requiredConfigs = [".prettierrc.json", "vite.config.ts", "tsconfig.json", "push.sh"]

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

  it("should configure Vite with Tailwind plugin", async () => {
    const viteConfigPath = path.join(projectPath, "vite.config.ts")
    try {
      const viteConfig = await readFileSafe(viteConfigPath)
      // Check for Tailwind imports and configuration
      expect(viteConfig).toContain('import tailwindcss from "@tailwindcss/vite"')
      expect(viteConfig).toContain("tailwindcss()")

      // Check if the plugin is properly added to the config
      expect(viteConfig).toMatch(/plugins:\s*\[[\s\S]*?tailwindcss\(\)[\s\S]*?\]/)
    } catch (error) {
      // Log the error for debugging
      console.error(`Failed to read or parse ${viteConfigPath}:`, error)
      throw error // Re-throw to fail the test
    }
  })

  it("should clean up unnecessary files", async () => {
    const deletedFiles = ["src/app.css", "src/assets", "eslint.config.js"]

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

  it("should have the correct App component structure", async () => {
    const appPath = path.join(projectPath, "src/app.tsx")
    const appContent = await readFileSafe(appPath)

    // Check for basic structure
    expect(appContent).toContain("function App()")
    expect(appContent).toContain("export default App")

    // Check for Tailwind classes
    expect(appContent).toContain("className=")

    // Check for the expected content
    expect(appContent).toContain('<h1 className="text-3xl font-bold underline">Hello</h1>')
  })

  it("should have Tailwind CSS directive in index.css", async () => {
    const indexPath = path.join(projectPath, "src/index.css")
    const cssContent = await readFileSafe(indexPath)

    // Check for Tailwind v4 directive
    expect(cssContent.trim()).toBe('@import "tailwindcss";')
  })
})
