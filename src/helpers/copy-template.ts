import fsx from "fs-extra"

export async function copyTemplateFolder(templatePath: string, destinationPath: string) {
  try {
    await fsx.copy(templatePath, destinationPath)
    console.log(`Copied ${templatePath} to ${destinationPath}`)
  } catch (error) {
    console.error(`Failed to copy ${templatePath} to ${destinationPath}:`, error)
  }
}
