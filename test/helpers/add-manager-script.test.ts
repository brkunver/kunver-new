import { mkdtemp, mkdir, readFile, rm, writeFile } from "fs/promises"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, it } from "vitest"

import { addManagerScript } from "@/helpers"

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

describe("addManagerScript", () => {
  it("writes a bun manager script for bun projects", async () => {
    const { cwd, projectName, projectPath } = await makeProject("bun")

    await addManagerScript("bun", projectName, cwd)

    const packageJson = JSON.parse(await readFile(join(projectPath, "package.json"), "utf-8"))
    expect(packageJson.scripts).toMatchObject({
      dev: "vite",
      manager: "bun manager.cjs bun",
    })
  })

  it("writes a node manager script for non-bun projects", async () => {
    const { cwd, projectName, projectPath } = await makeProject("npm")

    await addManagerScript("npm", projectName, cwd)

    const packageJson = JSON.parse(await readFile(join(projectPath, "package.json"), "utf-8"))
    expect(packageJson.scripts.manager).toBe("node manager.cjs npm")
  })
})
