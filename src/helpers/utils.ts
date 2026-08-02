import fs from "fs"
import path, { dirname } from "path"
import { fileURLToPath } from "url"
import chalk from "chalk"

/**
 * A cross-runtime and cross-module-format compatible way to get the current directory
 */
export function getDirname(): string {
  if (typeof __dirname !== "undefined") {
    // In CJS or runtimes that provide __dirname
    return __dirname
  }

  if (typeof import.meta !== "undefined" && import.meta.url) {
    // In ESM
    return dirname(fileURLToPath(import.meta.url))
  }

  // Fallback, usually process.cwd() or similar, but typically the above covers all bases
  return process.cwd()
}

/**
 * Check if a command is available in the system PATH
 */
export function commandExists(command: string): boolean {
  const pathEnv = process.env.PATH || ""
  const pathDirs = pathEnv.split(process.platform === "win32" ? ";" : ":")

  let extensions: string[] = [""]
  if (process.platform === "win32") {
    const pathExt = process.env.PATHEXT || ".EXE;.CMD;.BAT;.COM"
    extensions = pathExt.split(";").map(ext => ext.toLowerCase())
    if (!extensions.includes("")) {
      extensions.push("")
    }
  }

  for (const dir of pathDirs) {
    if (!dir) continue
    for (const ext of extensions) {
      const fullPath = path.join(dir, command + ext)
      try {
        if (process.platform === "win32") {
          if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
            return true
          }
        } else {
          fs.accessSync(fullPath, fs.constants.X_OK)
          if (fs.statSync(fullPath).isFile()) {
            return true
          }
        }
      } catch {
        // ignore errors
      }
    }
  }
  return false
}

/**
 * Remove a partially created project folder on failure.
 * Never touches folders that already existed before the operation.
 */
export async function cleanupProjectFolder(projectPath: string, projectName: string, existedBefore: boolean) {
  if (existedBefore) {
    return
  }

  try {
    await fs.promises.rm(projectPath, { recursive: true, force: true })
    console.log(chalk.yellow(`Removed partially created project folder "${projectName}"`))
  } catch {
    // Ignore cleanup errors so the original failure is not masked.
  }
}
