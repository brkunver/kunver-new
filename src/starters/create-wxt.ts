import chalk from "chalk"
import { select } from "@inquirer/prompts"

import * as constant from "@/constant"

import { createTemplateProject } from "@/helpers"

type projectOptions = {
  name: string
  packageManager: constant.TpackageManager
  selectedFramework?: constant.TwxtTemplatesType
}

export async function createWxtProject(options: projectOptions) {
  const { name, packageManager, selectedFramework } = options

  try {
    // Determine available templates and a safe default
    const availableFrameworks = constant.wxtTemplates
    const defaultFramework = availableFrameworks.includes("svelte") ? "svelte" : availableFrameworks[0]

    let framework: constant.TwxtTemplatesType

    // If user provided a selection and it is valid, use it. Otherwise ask via prompt.
    if (selectedFramework && availableFrameworks.includes(selectedFramework)) {
      framework = selectedFramework
    } else {
      framework = (await select({
        message: chalk.bold.magenta("Select a framework for WXT"),
        // Present nicer labels while keeping the original values
        choices: availableFrameworks.map(f => ({ name: f.charAt(0).toUpperCase() + f.slice(1), value: f })),
        default: defaultFramework,
      })) as constant.TwxtTemplatesType
    }

    switch (framework) {
      case "svelte":
        await createTemplateProject({ templateName: "wxt-svelte", name, packageManager })
        break
      case "solid":
        await createTemplateProject({ templateName: "wxt-solid", name, packageManager })
        break
      case "vanilla":
        await createTemplateProject({ templateName: "wxt-vanilla", name, packageManager })
        break
      default:
        break
    }
  } catch (error) {
    console.error(error)
  }
}
