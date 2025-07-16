// install tailwind helper
import { readFileSync, writeFileSync } from "fs"
import { spawn } from "node:child_process"
import ora from "ora"
import { approveBuilds } from "./pnpm-approve"

function editViteConfig(projectName: string) {
  const path = `${projectName}/vite.config.ts`
  const spinner = ora("Editing vite.config.ts...")
  spinner.color = "blue"
  spinner.start()
  
  try {
    // Read the file
    let viteConfig = readFileSync(path, "utf-8")
    
    // Check if the import already exists to avoid duplicates
    if (!viteConfig.includes('import tailwindcss from "@tailwindcss/vite"')) {
      // Add the import at the top of the file
      viteConfig = 'import tailwindcss from "@tailwindcss/vite"\n' + viteConfig
      
      // add tailwind to plugins
      viteConfig = viteConfig.replace(
        /plugins:\s*\[.*?\]/,
        'plugins: [react(), tailwindcss()]'
      )
      
      writeFileSync(path, viteConfig, 'utf-8')
      
      spinner.succeed("Updated vite.config.ts with Tailwind import")
    } else {
      spinner.info("Tailwind import already exists in vite.config.ts")
    }
  } catch (error) {
    spinner.fail(`Failed to edit vite.config.ts: ${error}`)
    console.error(error)
  }
}

export function installTailwind(packageManager: string, projectName: string): Promise<boolean> {
  return new Promise(resolve => {
    const command = "cd " + projectName + " && " + packageManager + " install tailwindcss @tailwindcss/vite"
    const child = spawn(command, { shell: true, cwd: process.cwd() })
    const spinner = ora("Installing Tailwind...")
    spinner.color = "blue"
    spinner.start()

    child.on("close", code => {
      spinner.stop()
      if (code === 0) {
        console.log("✅ Installed tailwind")
        editViteConfig(projectName)
        resolve(true)
      } else {
        console.error("❌ Failed to install tailwind")
        resolve(false)
      }
    })
  })
}
