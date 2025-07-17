import { installDependencies } from "../helpers/install-deps"
import { installTailwind } from "../helpers/install-tailwind"
import { copyConfigFiles } from "../helpers/copy-config-files"
import { installReact } from "../helpers/install-react"

type projectOptions = {
  name: string
  packageManager: string
}

// create react-ts project
export async function createReactProject(options: projectOptions) {
  const { name, packageManager } = options
  const isReactCreated = await installReact(packageManager, name)

  if (isReactCreated) {
    // install dependencies
    await installDependencies(packageManager, name)
    
    // copy config files
    await copyConfigFiles(name)
    
    // install tailwind
    await installTailwind(packageManager, name)
  }
}
