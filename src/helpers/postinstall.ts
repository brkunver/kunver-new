import { readFile, writeFile } from "fs/promises"
import { join } from "path"

// change project name in package.json
export async function changeProjectName(projectPath: string, newName: string): Promise<boolean> {
  try {
    const packageJsonPath = join(projectPath, "package.json")
    const jsonFile = await readFile(packageJsonPath, "utf-8")
    const packageJson = JSON.parse(jsonFile)

    // Update the name field
    packageJson.name = newName.toLowerCase().replace(/\s+/g, "-")

    // Write the updated package.json back to disk
    await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n")

    return true
  } catch (error) {
    console.error("Error updating project name:", error)
    return false
  }
}
