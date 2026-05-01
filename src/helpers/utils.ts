import { dirname } from "path"
import { fileURLToPath } from "url"

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
