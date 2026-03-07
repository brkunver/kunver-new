import { constants } from "fs"
import { access, mkdtemp, mkdir, readFile, rm, writeFile } from "fs/promises"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("ora", () => {
  const spinner = {
    succeed: vi.fn(),
    fail: vi.fn(),
  }

  return {
    default: vi.fn(() => ({
      start: vi.fn(() => spinner),
    })),
  }
})

import { copyTemplateFolder } from "@/helpers"

const createdPaths: string[] = []

async function makeTempDir() {
  const directoryPath = await mkdtemp(join(tmpdir(), "kunver-new-test-"))
  createdPaths.push(directoryPath)
  return directoryPath
}

async function exists(filePath: string) {
  try {
    await access(filePath, constants.F_OK)
    return true
  } catch {
    return false
  }
}

afterEach(async () => {
  await Promise.all(createdPaths.splice(0).map(directoryPath => rm(directoryPath, { recursive: true, force: true })))
})

describe("copyTemplateFolder", () => {
  it("copies the template and restores underscore-prefixed dotfiles", async () => {
    const sourceRoot = await makeTempDir()
    const destinationRoot = await makeTempDir()
    const templatePath = join(sourceRoot, "template")
    const nestedPath = join(templatePath, "nested")
    const destinationPath = join(destinationRoot, "generated-project")

    await mkdir(nestedPath, { recursive: true })
    await writeFile(join(templatePath, "_gitignore"), "dist\n", "utf-8")
    await writeFile(join(nestedPath, "_prettierrc.json"), '{"semi": false}\n', "utf-8")
    await writeFile(join(templatePath, "README.md"), "hello\n", "utf-8")

    const isCopied = await copyTemplateFolder(templatePath, destinationPath)

    expect(isCopied).toBe(true)
    expect(await exists(join(destinationPath, ".gitignore"))).toBe(true)
    expect(await exists(join(destinationPath, "nested", ".prettierrc.json"))).toBe(true)
    expect(await exists(join(destinationPath, "_gitignore"))).toBe(false)
    expect(await readFile(join(destinationPath, ".gitignore"), "utf-8")).toBe("dist\n")
    expect(await readFile(join(destinationPath, "nested", ".prettierrc.json"), "utf-8")).toBe('{"semi": false}\n')
  })
})
