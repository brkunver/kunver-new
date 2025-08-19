import { promises as fs } from "fs"
import ora from "ora"

export async function copyTemplateFolder(templatePath: string, destinationPath: string) {
  const spinner = ora("Copying template folder...").start()
  try {
    await fs.cp(templatePath, destinationPath, { recursive: true })
    spinner.succeed("Copied template folder")
    return true
  } catch (error) {
    spinner.fail("Failed to copy template folder")
    return false
  }
}
