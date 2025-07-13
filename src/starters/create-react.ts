import { spawn } from "node:child_process"
import { installDependencies } from "../helpers/install-deps"
import { approveBuilds } from "../helpers/pnpm-approve"
import ora from "ora"

type projectOptions = {
  name: string
  packageManager: string
}

// create react-ts project
export async function createReactProject(options: projectOptions) {
  const { name, packageManager } = options
  let command: string
  switch (packageManager) {
    case "pnpm":
      command = `pnpm create vite ${name} --template react-swc-ts`
      break
    case "npm":
      command = `npm create vite@latest ${name} -- --template react-swc-ts`
      break
    case "bun":
      command = `bun create vite ${name} --template react-swc-ts`
      break
    default:
      command = `pnpm create vite ${name} --template react-swc-ts`
  }
  const child = spawn(command, { shell: true })
  // child.stdout.pipe(process.stdout)
  // child.stderr.pipe(process.stderr)
  const spinner = ora("Creating React project...")
  spinner.color = "blue"
  spinner.start()

  child.on("close", async code => {
    spinner.stop()
    if (code == 0) {
      console.log(`Created React project at ${name}`)
      // install dependencies
      const dependencyInstallSuccess = await installDependencies(packageManager, name)
      if (dependencyInstallSuccess && packageManager == "pnpm") {
        approveBuilds()
      }
    } else {
      console.error(`Failed to create React project at ${name}`)
    }
  })
}
