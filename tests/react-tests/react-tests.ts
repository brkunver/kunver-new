import { createTempDir, removeTempDir } from "../tools/tempdir"
import { createReactProject } from "../../src/starters/create-react"
import chalk from "chalk"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import fs from "node:fs/promises"
import path from "node:path"
import { packageManagers } from "../../src/project-starter"

export const runReactTests = (packageManager: (typeof packageManagers)[number]) => {
  const projectName = "testing-react"

  describe.sequential(`${packageManager} react test`, () => {
    let tempDir: string
    let projectPath: string

    beforeAll(async () => {
      const createdTempDir = await createTempDir()
      if (!createdTempDir) throw new Error("Failed to create temp directory")
      tempDir = createdTempDir
      projectPath = path.join(tempDir, projectName)
      console.log(chalk.green(`Temporary directory created at: ${tempDir}`))
    })

    afterAll(async () => {
      await removeTempDir(tempDir)
    })

    it("should create a react project with " + packageManager, async () => {
      await createReactProject({ name: projectName, packageManager, cwd: tempDir })

      try {
        await fs.access(projectPath)
        expect(true)
      } catch (error) {
        expect(false)
      }
    })

    it("should install dependencies with " + packageManager, async () => {
      try {
        await fs.access(projectPath + "/node_modules")
        expect(true)
      } catch (error) {
        expect(false)
      }
    })

    it("should have config files, with " + packageManager, async () => {
      try {
        await fs.access(projectPath + "/.prettierrc.json")
        await fs.access(projectPath + "/push.sh")
        expect(true)
      } catch (error) {
        expect(false)
      }
    })

    it("should have tailwind import in vite config, with " + packageManager, async () => {
      try {
        const viteConfig = await fs.readFile(projectPath + "/vite.config.ts", "utf-8")
        expect(viteConfig.includes('import tailwindcss from "@tailwindcss/vite"'))
      } catch (error) {
        expect(false)
      }
    })

    it("should have tailwind in 'plugins' with " + packageManager, async () => {
      try {
        const viteConfig = await fs.readFile(projectPath + "/vite.config.ts", "utf-8")
        expect(viteConfig.includes("tailwindcss()"))
      } catch (error) {
        expect(false)
      }
    })

    it("should have tailwind directive in index.css, with " + packageManager, async () => {
      try {
        const indexCss = await fs.readFile(projectPath + "/src/index.css", "utf-8")
        expect(indexCss.includes('@import "tailwindcss";'))
      } catch (error) {
        expect(false)
      }
    })

    it("should have deleted app.css with " + packageManager, async () => {
      try {
        await fs.access(projectPath + "/src/app.css")
        expect(false)
      } catch (error) {
        expect(true)
      }
    })

    it("should have deleted assets with " + packageManager, async () => {
      try {
        await fs.access(projectPath + "/src/assets")
        expect(false)
      } catch (error) {
        expect(true)
      }
    })

    it("should have deleted eslint.config.js with " + packageManager, async () => {
      try {
        await fs.access(projectPath + "/eslint.config.js")
        expect(false)
      } catch (error) {
        expect(true)
      }
    })

    it("should have cleared app.tsx with " + packageManager, async () => {
      const newContent = `
  function App() {
    return (
      <>
        <h1 className="text-3xl font-bold underline">Hello</h1>
      </>
    )
  }

  export default App
`

      try {
        const appTsx = await fs.readFile(projectPath + "/src/app.tsx", "utf-8")
        expect(appTsx.includes(newContent))
      } catch (error) {
        expect(false)
      }
    })
  })
}
