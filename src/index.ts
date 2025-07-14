import { input, select } from "@inquirer/prompts"
import projectStarter, { projects, packageManagers } from "./project-starter"
import chalk from "chalk"

// select project name
const projectName = await input({
  message: chalk.bold.blue("Enter a project name"),
  default: chalk.gray("my-project"),
  validate: value => value.length > 0,
})

const packageManager: (typeof packageManagers)[number] = await select({
  message: chalk.bold.green("Select a package manager"),
  choices: packageManagers,
  default: "pnpm",
})

// select project type
const projectType: (typeof projects)[number] = await select({
  message: chalk.bold.yellow("Select a project type"),
  default: "react-ts-tw",
  choices: projects,
})

// create project
const options = {
  projectType,
  packageManager,
  name: projectName,
}

projectStarter(options)
