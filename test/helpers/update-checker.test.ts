import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { mkdtemp, rm, writeFile, readFile } from "fs/promises"
import { tmpdir } from "os"
import { join } from "path"
import fs from "fs"

const tempDirs: string[] = []
let mockHomeDir = ""

vi.mock("os", async importOriginal => {
  const actual = await importOriginal<typeof import("os")>()
  return {
    ...actual,
    homedir: () => mockHomeDir,
  }
})

// Mock child_process spawn
const spawnMock = vi.fn().mockReturnValue({ unref: vi.fn() })
vi.mock("child_process", () => ({
  spawn: (...args: any[]) => spawnMock(...args),
}))

import { checkForUpdates, runBackgroundCheck } from "@/helpers/update-checker"

describe("update-checker", () => {
  beforeEach(async () => {
    mockHomeDir = await mkdtemp(join(tmpdir(), "kunver-update-test-"))
    tempDirs.push(mockHomeDir)
    spawnMock.mockClear()
  })

  afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })))
  })

  it("returns null and spawns background check if cache does not exist", () => {
    const message = checkForUpdates("1.0.0")
    expect(message).toBeNull()
    expect(spawnMock).toHaveBeenCalled()
  })

  it("does not spawn background check if cache is fresh", async () => {
    const cachePath = join(mockHomeDir, ".kunver-update-cache.json")
    await writeFile(
      cachePath,
      JSON.stringify({
        latestVersion: "1.0.0",
        lastChecked: Date.now(),
      }),
      "utf-8",
    )

    const message = checkForUpdates("1.0.0")
    expect(message).toBeNull()
    expect(spawnMock).not.toHaveBeenCalled()
  })

  it("returns a warning message if cached version is newer than current", async () => {
    const cachePath = join(mockHomeDir, ".kunver-update-cache.json")
    await writeFile(
      cachePath,
      JSON.stringify({
        latestVersion: "2.0.0",
        lastChecked: Date.now(),
      }),
      "utf-8",
    )

    const message = checkForUpdates("1.0.0")
    expect(message).not.toBeNull()
    expect(message).toContain("A new version of @kunver/new is available: 2.0.0")
  })

  it("spawns background check if cache exists but is older than 24 hours", async () => {
    const cachePath = join(mockHomeDir, ".kunver-update-cache.json")
    await writeFile(
      cachePath,
      JSON.stringify({
        latestVersion: "1.0.0",
        lastChecked: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
      }),
      "utf-8",
    )

    const message = checkForUpdates("1.0.0")
    expect(message).toBeNull()
    expect(spawnMock).toHaveBeenCalled()
  })

  it("runBackgroundCheck fetches latest version and updates cache file", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ version: "3.10.0" }),
    })
    vi.stubGlobal("fetch", fetchMock)

    await runBackgroundCheck()

    const cachePath = join(mockHomeDir, ".kunver-update-cache.json")
    expect(fs.existsSync(cachePath)).toBe(true)

    const cacheData = JSON.parse(await readFile(cachePath, "utf-8"))
    expect(cacheData.latestVersion).toBe("3.10.0")
    expect(typeof cacheData.lastChecked).toBe("number")

    vi.unstubAllGlobals()
  })
})
