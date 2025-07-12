import { input, select } from "@inquirer/prompts"
import projectStarter, { projects, packageManagers } from "./project-starter"

const packageManager : typeof packageManagers[number] = await select({
    message: "Select a package manager",
    choices: packageManagers,
    default: "pnpm",
})

// select project type
const projectType : typeof projects[number] = await select({
    message: "Select a project type",
    choices: projects,
})

// select project name
const projectName = await input({
    message: "Enter a project name",
    validate: (value) => value.length > 0,
})

// create project
const options = {
    projectType,
    packageManager,
    name: projectName,
}
projectStarter(options)