import { installDependencies } from "../helpers/install-deps"
import { installTailwind } from "../react-starter/install-tailwind"
import { copyConfigFiles } from "../helpers/copy-config-files"
import { installReact } from "../react-starter/install-react"
import { approveBuilds } from "../helpers/pnpm-approve"
import { postInstallReact } from "../react-starter/post-install-react"

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
    
    // approve builds
    if (packageManager === "pnpm") {
      await approveBuilds(name)
    }

    // post install react
    await postInstallReact(name, packageManager)
  }
}
