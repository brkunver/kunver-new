import { createWxtProject, createPythonNotebookProject } from "@/starters"

import { openInEditor, createTemplateProject, configureCmakeProject, changeCmakeProjectName } from "@/helpers"

import * as constant from "./constant"
import chalk from "chalk"

type ProjectStarterOptions = {
  projectType: constant.TprojectType
  packageManager: constant.TpackageManager
  openInEditor: constant.TopenInEditor
  name: string
}

type ProjectStarterHandler = (options: ProjectStarterOptions) => Promise<void>

function createTemplateStarter(
  templateName: string,
  overrides?: Partial<Parameters<typeof createTemplateProject>[0]>,
): ProjectStarterHandler {
  return async options => {
    await createTemplateProject({
      templateName,
      name: options.name,
      packageManager: options.packageManager,
      ...overrides,
    })
  }
}

const projectStarters: Record<constant.TprojectType, ProjectStarterHandler> = {
  "react-ts-tw": createTemplateStarter("react-ts-tw"),
  "next-ts-prisma": createTemplateStarter("next-prisma"),
  wxt: async options => {
    await createWxtProject({ name: options.name, packageManager: options.packageManager })
  },
  "uv-notebook": async options => {
    await createPythonNotebookProject({ name: options.name })
  },
  "cmake-cpp": async options => {
    await createTemplateProject({
      templateName: "cmake-cpp",
      name: options.name,
      packageManager: "pnpm",
      addManager: false,
      approveBuild: false,
      installDependency: false,
      changeName: false,
      onBeforeInstall: async projectPath => {
        await changeCmakeProjectName(projectPath, options.name)
        await configureCmakeProject(projectPath)
      },
    })
  },
}

export default async function projectStarter(options: ProjectStarterOptions) {
  const starter = projectStarters[options.projectType]

  if (!starter) {
    console.log(chalk.red("Project Type Not Implemented"), options.projectType)
    return
  }

  await starter(options)

  if (options.openInEditor !== "no") {
    await openInEditor(options.name, process.cwd(), options.openInEditor)
  }
}
