import { prettierConfigFile, pushFile } from "./config-files"

import { writeFileSync } from "fs"
import { join } from "path"

export function copyConfigFiles(projectName: string) {
  const projectPath = join(process.cwd(), projectName)

  // Copy .prettierrc.json
  writeFileSync(join(projectPath, ".prettierrc.json"), prettierConfigFile)

  // Copy push.sh
  writeFileSync(join(projectPath, "push.sh"), pushFile)
}
