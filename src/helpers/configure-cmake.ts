import { readFile, writeFile } from "fs/promises"
import { join } from "path"

import { execa } from "execa"
import chalk from "chalk"

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

export async function configureCmakeProject(projectPath: string) {
  console.log(chalk.white("Configuring CMake project in " + chalk.blue(projectPath)))

  try {
    await execa("cmake", ["-S", ".", "-B", "build"], {
      cwd: projectPath,
      stdout: "inherit",
      stderr: "inherit",
    })

    console.log(chalk.green("CMake project configured successfully"))
    return true
  } catch {
    console.log(chalk.yellow("Automatic CMake configure skipped. Run `cmake -S . -B build` manually if needed."))
    return false
  }
}
