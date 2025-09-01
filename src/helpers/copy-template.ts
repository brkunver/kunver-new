import { promises as fs } from "fs"
import path from "path"
import ora from "ora"

export async function copyTemplateFolder(templatePath: string, destinationPath: string) {
  const spinner = ora("Copying template folder...").start()
  try {
    await fs.cp(templatePath, destinationPath, { recursive: true })

    // Rename _gitignore to .gitignore if it exists
    const gitignorePath = path.join(destinationPath, "_gitignore")
    const targetPath = path.join(destinationPath, ".gitignore")
    try {
      await fs.rename(gitignorePath, targetPath)
    } catch {
      // ignore if _gitignore does not exist
    }

    spinner.succeed("Copied template folder")
    return true
  } catch (error) {
    spinner.fail("Failed to copy template folder")
    return false
  }
}
