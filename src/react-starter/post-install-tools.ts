import { writeFile, unlink, rm } from "node:fs/promises"
import ora from "ora"
import { spawn } from "node:child_process"

export async function editReadme(projectName: string) {
  const path = `${projectName}/README.md`
  const spinner = ora("Editing README.md...").start()
  spinner.color = "white"

  try {
    const readmeContent = `# ${projectName}`
    await writeFile(path, readmeContent, "utf-8")
    spinner.succeed("Updated README.md")
  } catch (error) {
    spinner.fail(`Failed to edit README.md: ${error}`)
    console.error(error)
  }
}

export async function deleteAssets(projectName: string) {
  const path = `${projectName}/src/assets`
  const spinner = ora("Deleting assets...").start()
  spinner.color = "white"

  try {
    await rm(path, { recursive: true, force: true })
    spinner.succeed("Deleted assets")
  } catch (error) {
    spinner.fail(`Failed to delete assets: ${error}`)
    console.error(error)
  }
}

export async function deleteAppCss(projectName: string) {
  const path = `${projectName}/src/app.css`
  const spinner = ora("Deleting app.css...").start()
  spinner.color = "white"

  try {
    await unlink(path)
    spinner.succeed("Deleted app.css")
  } catch (error) {
    spinner.fail(`Failed to delete app.css: ${error}`)
    console.error(error)
  }
}

export async function clearAppTsx(projectName: string) {
  const path = `${projectName}/src/app.tsx`
  const spinner = ora("Clearing app.tsx...").start()
  spinner.color = "white"

  const newContent = `
  function App() {
    return (
      <>
        <h1 className="text-3xl font-bold underline">Hello</h1>
      </>
    )
  }

  export default App
`

  try {
    await writeFile(path, newContent, "utf-8")
    spinner.succeed("Cleared app.tsx")
  } catch (error) {
    spinner.fail(`Failed to clear app.tsx: ${error}`)
    console.error(error)
  }
}

export async function deleteEslintFile(projectName: string) {
  const path = `${projectName}/eslint.config.js`
  const spinner = ora("Deleting eslint.config.js...").start()
  spinner.color = "white"

  try {
    await unlink(path)
    spinner.succeed("Deleted eslint.config.js")
  } catch (error) {
    spinner.fail(`Failed to delete eslint.config.js: ${error}`)
    console.error(error)
  }
}

export async function removePackages(projectName: string, packageManager: string) {
  const command =
    "cd " +
    projectName +
    " && " +
    packageManager +
    " remove @eslint/js eslint eslint-plugin-react-hooks eslint-plugin-react-refresh globals typescript-eslint"
  return new Promise(resolve => {
    const child = spawn(command, { shell: true, cwd: process.cwd() })
    const spinner = ora("Removing packages...").start()
    spinner.color = "white"
    spinner.start()

    child.on("close", code => {
      if (code === 0) {
        spinner.succeed("Removed packages")
        resolve(true)
      } else {
        spinner.fail("Failed to remove packages")
        resolve(false)
      }
    })
  })
}
