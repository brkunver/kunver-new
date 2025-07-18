import { installDependencies } from "../helpers/install-deps"
import { installTailwind } from "../react-starter/install-tailwind"
import { copyConfigFiles } from "../helpers/copy-config-files"
import { installReact } from "../react-starter/install-react"
import { pnpmApproveBuilds } from "../helpers/pnpm-approve"
import { bunApproveBuilds } from "../helpers/bun-approve"
import { postInstallReact } from "../react-starter/post-install-react"

import { packageManagers } from "../project-starter"

type projectOptions = {
  name: string
  packageManager: (typeof packageManagers)[number]
  cwd?: string
}

// create react-ts project
export async function createReactProject(options: projectOptions) {
  const { name, packageManager, cwd = process.cwd() } = options

  try {
    const isReactCreated = await installReact(packageManager, name, cwd)

    if (isReactCreated) {
      // install dependencies
      await installDependencies(packageManager, name, cwd)

      // copy config files
      await copyConfigFiles(name, cwd)

      // install tailwind
      await installTailwind(packageManager, name, cwd)

      // approve builds
      if (packageManager === "pnpm") {
        await pnpmApproveBuilds(name, cwd)
      } else if (packageManager === "bun") {
        await bunApproveBuilds(name, cwd)
      }

      // post install react
      await postInstallReact(name, packageManager, cwd)
    }
  } catch (error) {
    console.error(error)
  }
}
