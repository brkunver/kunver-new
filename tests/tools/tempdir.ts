import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

export async function createTempDir() {
  try {
    const tempPrefix = join(tmpdir(), "my-app-")
    const tempDir = await mkdtemp(tempPrefix)

    console.log("Temporary directory created at:", tempDir)
    return tempDir
  } catch (error) {
    console.error("Failed to create temp directory:", error)
  }
}

export async function removeTempDir(tempDir: string | undefined) {
  try {
    if (!tempDir) {
      console.log("No temp directory provided")
      return
    }
    await rm(tempDir, { recursive: true, force: true })
    console.log("Temporary directory removed:", tempDir)
  } catch (error) {
    console.error("Failed to remove temp directory:", error)
  }
}
