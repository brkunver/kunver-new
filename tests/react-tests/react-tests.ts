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

    beforeAll(async () => {
      const createdTempDir = await createTempDir()
      if (!createdTempDir) throw new Error("Failed to create temp directory")
      tempDir = createdTempDir
      console.log(chalk.green(`Temporary directory created at: ${tempDir}`))
    })

    afterAll(async () => {
      await removeTempDir(tempDir)
    })

    it("should create a react project", async () => {
      await createReactProject({ name: projectName, packageManager, cwd: tempDir })

      const projectPath = path.join(tempDir, projectName)
      try {
        await fs.access(projectPath)
        expect(true)
      } catch (error) {
        expect(false)
      }
    })

    it("should install dependencies", async () => {
      const projectPath = path.join(tempDir, projectName)
      try {
        await fs.access(projectPath + "/node_modules")
        expect(true)
      } catch (error) {
        expect(false)
      }
    })
  })
}
