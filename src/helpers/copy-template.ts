import fsx from "fs-extra"
import ora from "ora"

export async function copyTemplateFolder(templatePath: string, destinationPath: string) {
  const spinner = ora("Copying template folder...").start()
  try {
    await fsx.copy(templatePath, destinationPath)
    spinner.succeed("Copied template folder")
    return true
  } catch (error) {
    spinner.fail("Failed to copy template folder")
    return false
  }
}
