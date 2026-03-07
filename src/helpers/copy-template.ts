import { promises as fs } from "fs"
import path from "path"
import ora from "ora"

async function restoreDotPrefixedNames(directoryPath: string) {
  const entries = await fs.readdir(directoryPath, { withFileTypes: true })

  for (const entry of entries) {
    const currentPath = path.join(directoryPath, entry.name)
    let resolvedPath = currentPath

    if (entry.name.startsWith("_") && entry.name.length > 1) {
      resolvedPath = path.join(directoryPath, `.${entry.name.slice(1)}`)
      await fs.rename(currentPath, resolvedPath)
    }

    if (entry.isDirectory()) {
      await restoreDotPrefixedNames(resolvedPath)
    }
  }
}

export async function copyTemplateFolder(templatePath: string, destinationPath: string) {
  const spinner = ora("Copying template folder...").start()
  try {
    await fs.cp(templatePath, destinationPath, { recursive: true })

    // Template placeholders like _gitignore or _clang-format are restored after copy.
    await restoreDotPrefixedNames(destinationPath)

    spinner.succeed("Copied template folder")
    return true
  } catch (error) {
    spinner.fail("Failed to copy template folder")
    return false
  }
}
