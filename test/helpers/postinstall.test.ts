import { mkdtemp, readFile, rm, writeFile } from "fs/promises"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, it, vi } from "vitest"

import { changeProjectName } from "@/helpers"

const createdPaths: string[] = []

async function makeTempDir() {
  const directoryPath = await mkdtemp(join(tmpdir(), "kunver-new-test-"))
  createdPaths.push(directoryPath)
  return directoryPath
}

afterEach(async () => {
  await Promise.all(createdPaths.splice(0).map(directoryPath => rm(directoryPath, { recursive: true, force: true })))
})

describe("changeProjectName", () => {
  it("normalizes the project name and updates package.json", async () => {
    const projectPath = await makeTempDir()
    await writeFile(
      join(projectPath, "package.json"),
      JSON.stringify({ name: "old-name", version: "1.0.0" }, null, 2),
      "utf-8",
    )

    const isUpdated = await changeProjectName(projectPath, "My Fancy App")
    const packageJson = JSON.parse(await readFile(join(projectPath, "package.json"), "utf-8"))

    expect(isUpdated).toBe(true)
    expect(packageJson.name).toBe("my-fancy-app")
  })

  it("returns false when package.json does not exist", async () => {
    const projectPath = await makeTempDir()
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined)

    const isUpdated = await changeProjectName(projectPath, "Missing Package")

    expect(isUpdated).toBe(false)
    consoleError.mockRestore()
  })
})
