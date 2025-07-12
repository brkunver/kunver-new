import { select } from "@inquirer/prompts"
import projectStarter, { projects, packageManagers } from "./project-starter"

const packageManager : typeof packageManagers[number] = await select({
    message: "Select a package manager",
    choices: packageManagers,
})

// select project type
const projectType : typeof projects[number] = await select({
    message: "Select a project type",
    choices: projects,
}) 

// create project
projectStarter(projectType, packageManager)