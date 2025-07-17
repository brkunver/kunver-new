import { createTempDir, removeTempDir } from "../tools/tempdir"
import { createReactProject } from "../../src/starters/create-react"
import chalk from "chalk"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import fs from "node:fs/promises"
import path from "node:path"

const projectName = "testing-react"
const packageManager = "pnpm"

describe("create-react", () => {
  let tempDir: string | undefined
  beforeAll(async () => {
    tempDir = await createTempDir()
  })

  afterAll(async () => {
    await removeTempDir(tempDir)
  })

  it("should create a react project", async () => {
    if (!tempDir) throw new Error("Failed to create temp directory")
    console.log(chalk.green(`Temporary directory created at: ${tempDir}`))

    await createReactProject({ name: projectName, packageManager })

    const projectPath = path.join(tempDir, projectName)
    try {
      await fs.access(projectPath)
      expect(true)
    } catch (error) {
      expect(false)
    }
  }, 30000)
})
