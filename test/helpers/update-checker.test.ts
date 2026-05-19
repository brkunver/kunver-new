import { describe, it, expect, vi, beforeEach, afterEach, afterAll } from "vitest"
import { rm, writeFile, readFile } from "fs/promises"
import { existsSync } from "fs"
import { join } from "path"
import os from "os"

vi.mock("os", async importOriginal => {
  const actual = await importOriginal<typeof import("os")>()
  const fs = await import("fs")
  const path = await import("path")
  const mockHome = fs.mkdtempSync(path.join(actual.tmpdir(), "kunver-update-test-"))
  const mockOs = {
    ...actual,
    homedir: () => mockHome,
  }
  return {
    ...mockOs,
    default: mockOs,
  }
})

const cachePath = join(os.homedir(), ".kunver-update-cache.json")
const mockHomeDir = os.homedir()

// Mock child_process spawn
const spawnMock = vi.fn().mockReturnValue({ unref: vi.fn() })
vi.mock("child_process", () => ({
  spawn: (...args: any[]) => spawnMock(...args),
}))

import { checkForUpdates, runBackgroundCheck } from "@/helpers/update-checker"

describe("update-checker", () => {
  beforeEach(async () => {
    spawnMock.mockClear()
    if (existsSync(cachePath)) {
      await rm(cachePath, { force: true })
    }
  })

  afterEach(async () => {
    if (existsSync(cachePath)) {
      await rm(cachePath, { force: true })
    }
  })

  afterAll(async () => {
    await rm(os.homedir(), { recursive: true, force: true })
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
    expect(existsSync(cachePath)).toBe(true)

    const cacheData = JSON.parse(await readFile(cachePath, "utf-8"))
    expect(cacheData.latestVersion).toBe("3.10.0")
    expect(typeof cacheData.lastChecked).toBe("number")

    vi.unstubAllGlobals()
  })
})
