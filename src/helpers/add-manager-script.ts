import { join } from "path"
import fs from "fs"

const resizeCommands: Record<string, string> = {
  pnpm: "pnpm dlx @kunver/resize",
  npm: "npx @kunver/resize",
  bun: "bunx @kunver/resize",
}

function getTrustedDependencies(pnpmWorkspaceContent: string) {
  return pnpmWorkspaceContent
    .split(/\r?\n/)
    .map(line => line.match(/^\s{2}(.+?):\s*true\s*$/)?.[1])
    .filter((dependency): dependency is string => Boolean(dependency))
    .map(dependency => dependency.replace(/^['"]|['"]$/g, ""))
}

async function configurePackageJson(packageManager: string, packageJsonPath: string) {
  const packageJsonFile = await fs.promises.readFile(packageJsonPath, "utf-8")
  const packageJson = JSON.parse(packageJsonFile)

  packageJson.scripts = packageJson.scripts || {}
  packageJson.scripts.manager =
    packageManager === "bun" ? `bun manager.cjs ${packageManager}` : `node manager.cjs ${packageManager}`

  if (packageJson.scripts.resize) {
    packageJson.scripts.resize = resizeCommands[packageManager] ?? resizeCommands.pnpm
  }

  if (packageJson.scripts["zip:all"]) {
    packageJson.scripts["zip:all"] =
      packageManager === "bun" ? "bun --parallel zip zip:firefox" : "wxt zip && wxt zip -b firefox"
  }

  if (packageManager !== "bun") {
    delete packageJson.trustedDependencies
  }

  return packageJson
}

export async function configurePackageManager(packageManager: string, projectPath: string) {
  const packageJsonPath = join(projectPath, "package.json")
  const pnpmWorkspacePath = join(projectPath, "pnpm-workspace.yaml")
  const packageJson = await configurePackageJson(packageManager, packageJsonPath)

  if (packageManager === "bun") {
    try {
      const pnpmWorkspaceContent = await fs.promises.readFile(pnpmWorkspacePath, "utf-8")
      const trustedDependencies = getTrustedDependencies(pnpmWorkspaceContent)

      if (trustedDependencies.length > 0) {
        packageJson.trustedDependencies = trustedDependencies
      }
    } catch {
      // No pnpm workspace config to translate.
    }
  }

  await fs.promises.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2))

  if (packageManager !== "pnpm") {
    await fs.promises.rm(pnpmWorkspacePath, { force: true })
  }
}

export async function addManagerScript(packageManager: string, name: string, cwd: string) {
  const packageJsonPath = join(cwd, name, "package.json")
  const packageJson = await configurePackageJson(packageManager, packageJsonPath)
  await fs.promises.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2))
}
