import { join } from "node:path"
import fs from "node:fs"

export async function addManagerScript(packageManager: string, name: string, cwd: string) {
  const packageJsonPath = join(cwd, name, "package.json")
  const packageJsonFile = await fs.promises.readFile(packageJsonPath, "utf-8")
  const packageJson = JSON.parse(packageJsonFile)
  if (packageManager === "bun") {
    packageJson.scripts.manager = `bun manager.cjs ${packageManager}`
  } else {
    packageJson.scripts.manager = `node manager.cjs ${packageManager}`
  }
  await fs.promises.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2))
}
