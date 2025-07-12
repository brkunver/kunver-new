import { select } from "@inquirer/prompts"
import projectStarter, { projects } from "./project-starter"

// select project type
const answer : typeof projects[number] = await select({
    message: "Select a project type",
    choices: projects,
}) 

// create project
projectStarter(answer)