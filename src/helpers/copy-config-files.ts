import { prettierConfigFile, pushFile } from "./config-files"

import { writeFileSync } from "fs"
import { join } from "node:path"
import { execSync } from "child_process"
import chalk from "chalk"

export function copyConfigFiles(projectName: string) {
  const projectPath = join(process.cwd(), projectName)
  const pushShPath = join(projectPath, "push.sh")

  console.log(chalk.green("Copying config files to " + chalk.bold.blue(projectName)))
  // Copy .prettierrc.json
  writeFileSync(join(projectPath, ".prettierrc.json"), prettierConfigFile)

  // Copy push.sh and make it executable
  writeFileSync(pushShPath, pushFile)
  
  try {
    execSync(`chmod +x "${pushShPath}"`)
    console.log(chalk.green("✅ Set execute permissions for push.sh"))
  } catch (error) {
    console.warn(chalk.yellow(`Warning: Could not set execute permissions for push.sh: ${error}`))
  }
}
