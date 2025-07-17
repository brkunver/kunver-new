# About Project

- This project is a CLI tool for creating new projects. It is a opinionated project starter.
- User should select a project type and a package manager. Then it will create a new project with pre-configured settings.

- This project uses typescript for development.
- This project itself uses pnpm for package management.
- This project uses tsup for building.
- This project uses ora for cli loading indicators.
- This project uses chalk for cli colors.
- This project uses execa for running shell commands.
- This project uses @inquirer/prompts for prompts.
- This project's npm name is "@kunver/new"
- This project's bin name is "kunver"


- Code style should follow prettier rules (.prettierrc.json file).

## correct use of execa

first, call execa with parameters as an option object, then pass the command with template string

example:

const child = await execa({input : "a\ny\n"})`pnpm approve-builds`

wrong example:

const child = await execa("pnpm approve-builds", { input: "a\ny\n" })
