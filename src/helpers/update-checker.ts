import fs from "fs"
import os from "os"
import { join } from "path"
import { spawn } from "child_process"
import { fileURLToPath } from "url"
import chalk from "chalk"

const CACHE_FILE = join(os.homedir(), ".kunver-update-cache.json")
const CHECK_INTERVAL = 24 * 60 * 60 * 1000 // 24 hours

interface UpdateCache {
  latestVersion: string
  lastChecked: number
}

function parseSemver(version: string): number[] {
  return version.replace(/^v/, "").split(".").map(Number)
}

function isNewerVersion(current: string, latest: string): boolean {
  const currentParts = parseSemver(current)
  const latestParts = parseSemver(latest)

  for (let i = 0; i < 3; i++) {
    const curr = currentParts[i] || 0
    const lat = latestParts[i] || 0
    if (lat > curr) return true
    if (curr > lat) return false
  }
  return false
}

export function checkForUpdates(currentVersion: string): string | null {
  let cache: UpdateCache | null = null
  try {
    if (fs.existsSync(CACHE_FILE)) {
      cache = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"))
    }
  } catch {
    // Ignore cache read errors
  }

  const now = Date.now()
  const shouldCheck = !cache || now - cache.lastChecked > CHECK_INTERVAL

  if (shouldCheck) {
    try {
      const currentFile = fileURLToPath(import.meta.url)
      const child = spawn(process.execPath, [currentFile, "--background-update-check"], {
        detached: true,
        stdio: "ignore",
      })
      child.unref()
    } catch {
      // Ignore background spawn errors
    }
  }

  if (cache && isNewerVersion(currentVersion, cache.latestVersion)) {
    return chalk.yellow(
      `\n┌────────────────────────────────────────────────────────┐\n` +
        `│  A new version of ${chalk.bold("@kunver/new")} is available: ${chalk.green(cache.latestVersion)}  │\n` +
        `│  Current version: ${chalk.gray(currentVersion)}                            │\n` +
        `│  Run ${chalk.cyan("npm i -g @kunver/new")} or use ${chalk.cyan("bunx @kunver/new")}       │\n` +
        `└────────────────────────────────────────────────────────┘\n`,
    )
  }

  return null
}

export async function runBackgroundCheck() {
  try {
    const response = await fetch("https://registry.npmjs.org/@kunver/new/latest", {
      headers: { "User-Agent": "kunver-new-cli" },
      signal: AbortSignal.timeout(5000), // 5 seconds timeout
    })
    if (!response.ok) return

    const data = (await response.json()) as { version: string }
    if (data && data.version) {
      const cacheData: UpdateCache = {
        latestVersion: data.version,
        lastChecked: Date.now(),
      }
      fs.writeFileSync(CACHE_FILE, JSON.stringify(cacheData, null, 2), "utf-8")
    }
  } catch {
    // Ignore background network/write errors
  }
}
