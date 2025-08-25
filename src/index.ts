import fs from "fs"
import path from "path"

import { input, select } from "@inquirer/prompts"
import chalk from "chalk"

import projectStarter from "@/project-starter"
import * as constant from "@/constant"

const version: string = process.env.npm_package_version || chalk.red(" error ")

console.log(chalk.green("Kunver v" + chalk.bold(version) + "\n"))

const projectName = await input({
  message: chalk.bold.blue("Enter a project name"),
  default: chalk.gray("my-project"),
  validate: value => {
    if (!value || value.trim().length < 2) {
      return chalk.red("Project name must be at least 2 characters")
    }

    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(value)) {
      return chalk.red("Only lowercase letters, numbers, and single hyphens allowed. No spaces or special characters.")
    }

    if (fs.existsSync(path.resolve(process.cwd(), value))) {
      return chalk.red("A folder with that name already exists")
    }

    return true
  },
})

// select project type
const projectType: constant.TprojectType = await select({
  message: chalk.bold.yellow("Select a project type"),
  default: "react-ts-tw",
  choices: constant.projects,
})

let packageManager: constant.TpackageManager | undefined
if (projectType !== "python-notebook") {
  packageManager = await select({
    message: chalk.bold.green("Select a package manager"),
    choices: constant.packageManagers,
    default: "bun",
  })
}

// open in editor ?
const openInEditor: constant.TopenInEditor = await select({
  message: chalk.bold.cyan("Open in editor?"),
  choices: constant.openInEditorOptions,
  default: "no",
})

// create project
const options = {
  projectType,
  packageManager,
  name: projectName,
  openInEditor,
}

await projectStarter(options)
