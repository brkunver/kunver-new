import { createTempDir, removeTempDir } from "../tools/tempdir"
import { createReactProject } from "../../src/starters/create-react"
import chalk from "chalk"
import fs from "node:fs/promises"
import path from "node:path"

const projectName = "testing-react"
const packageManager = "pnpm"

try {
    const tempDir = await createTempDir()
    if (!tempDir) process.exit(1)
    console.log(chalk.green(`Temporary directory created at: ${tempDir}`))

    await createReactProject({ name: projectName, packageManager })

    await removeTempDir(tempDir)
} catch (error) {
    console.error(error)
}
