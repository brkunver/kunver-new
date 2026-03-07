import { readFile, writeFile } from "fs/promises"
import { join } from "path"

export async function changeCmakeProjectName(projectPath: string, newName: string): Promise<boolean> {
  try {
    const cmakeListsPath = join(projectPath, "CMakeLists.txt")
    const cmakeListsContent = await readFile(cmakeListsPath, "utf-8")

    const updatedContent = cmakeListsContent.replace(
      /project\s*\(\s*(?:"[^"]+"|[^\s\)]+)([\s\S]*?)\)/i,
      `project("${newName}"$1)`,
    )

    if (updatedContent === cmakeListsContent) {
      return false
    }

    await writeFile(cmakeListsPath, updatedContent)
    return true
  } catch (error) {
    console.error("Error updating CMake project name:", error)
    return false
  }
}
