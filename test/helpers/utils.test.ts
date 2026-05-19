import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { mkdtemp, rm, writeFile, chmod } from "fs/promises"
import { tmpdir } from "os"
import { join } from "path"
import { commandExists } from "@/helpers"

describe("commandExists", () => {
  let tempDir: string
  let originalPath: string | undefined
  let originalPathExt: string | undefined

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "kunver-utils-test-"))
    originalPath = process.env.PATH
    originalPathExt = process.env.PATHEXT
  })

  afterEach(async () => {
    process.env.PATH = originalPath
    process.env.PATHEXT = originalPathExt
    await rm(tempDir, { recursive: true, force: true })
  })

  it("returns false for non-existent commands", () => {
    process.env.PATH = tempDir
    expect(commandExists("nonexistentcommand")).toBe(false)
  })

  it("finds a command in the PATH", async () => {
    process.env.PATH = tempDir

    if (process.platform === "win32") {
      process.env.PATHEXT = ".EXE;.CMD"
      const testFile = join(tempDir, "testcmd.EXE")
      await writeFile(testFile, "")
      expect(commandExists("testcmd")).toBe(true)
    } else {
      const testFile = join(tempDir, "testcmd")
      await writeFile(testFile, "")
      await chmod(testFile, 0o755) // make executable
      expect(commandExists("testcmd")).toBe(true)
    }
  })
})
