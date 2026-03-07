import { execa } from "execa"
import chalk from "chalk"

export async function configureCmakeProject(projectPath: string) {
  console.log(chalk.white("Configuring CMake project in " + chalk.blue(projectPath)))

  try {
    await execa("cmake -S . -B build", {
      shell: true,
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
