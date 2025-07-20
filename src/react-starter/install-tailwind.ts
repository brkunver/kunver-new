// install tailwind helper
import { readFileSync, writeFileSync } from "fs"
import { execa } from "execa"
import ora from "ora"
import chalk from "chalk"

function editViteConfig(projectName: string, cwd: string) {
  const path = `${cwd}/${projectName}/vite.config.ts`
  const spinner = ora("Editing vite.config.ts...").start()
  spinner.color = "blue"

  try {
    // Read the file
    let viteConfig = readFileSync(path, "utf-8")

    // Check if the import already exists to avoid duplicates
    if (!viteConfig.includes('import tailwindcss from "@tailwindcss/vite"')) {
      // Add the import at the top of the file
      viteConfig = 'import tailwindcss from "@tailwindcss/vite"\n' + viteConfig

      // add tailwind to plugins
      viteConfig = viteConfig.replace(/plugins:\s*\[.*?\]/, "plugins: [react(), tailwindcss()]")

      writeFileSync(path, viteConfig, "utf-8")

      spinner.succeed("Updated vite.config.ts with Tailwind import")
    } else {
      spinner.info("Tailwind import already exists in vite.config.ts")
    }
  } catch (error) {
    spinner.fail(`Failed to edit vite.config.ts: ${error}`)
    console.error(error)
  }
}

function addTailwindDirective(projectName: string, cwd: string) {
  const indexCssPath = `${cwd}/${projectName}/src/index.css`
  const directive = '@import "tailwindcss";'
  const spinner = ora("Adding Tailwind directive to index.css...").start()

  writeFileSync(indexCssPath, directive, "utf-8")
  spinner.succeed("Added Tailwind directive to index.css")
}

export async function installTailwind(packageManager: string, projectName: string, cwd: string): Promise<boolean> {
  const command = "cd " + projectName + " && " + packageManager + " install tailwindcss @tailwindcss/vite"
  const spinner = ora("Installing Tailwind with " + chalk.blue(packageManager)).start()
  spinner.color = "blue"

  try {
    await execa(command, { shell: true, cwd: cwd })
    spinner.succeed("Installed tailwind")
    editViteConfig(projectName, cwd)
    addTailwindDirective(projectName, cwd)
    return true
  } catch (error) {
    spinner.fail("Failed to install tailwind")
    return false
  }
}
