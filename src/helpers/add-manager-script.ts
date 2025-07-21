import { join } from "node:path"
import fs from "node:fs"

export async function addManagerScript(packageManager: string, name: string, cwd: string) {
  const packageJsonPath = join(cwd, name, "package.json")
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"))
  if (packageManager === "bun") {
    packageJson.scripts.manager = `bun manager.cjs ${packageManager}`
  } else {
    packageJson.scripts.manager = `node manager.cjs ${packageManager}`
  }
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
}
