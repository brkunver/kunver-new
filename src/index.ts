import fs from "node:fs"
import path from "node:path"

import { input, select } from "@inquirer/prompts"
import chalk from "chalk"

import projectStarter, { TprojectType, TpackageManager, projects, packageManagers } from "./project-starter"

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
const projectType: TprojectType = await select({
  message: chalk.bold.yellow("Select a project type"),
  default: "react-ts-tw",
  choices: projects,
})

let packageManager: TpackageManager | undefined
if (projectType !== "python-notebook") {
  packageManager = await select({
    message: chalk.bold.green("Select a package manager"),
    choices: packageManagers,
    default: "bun",
  })
}

// open in editor ?
const openInEditor: "no" | "windsurf" | "cursor" | "code" = await select({
  message: chalk.bold.cyan("Open in editor?"),
  choices: ["no", "windsurf", "cursor", "code"],
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
