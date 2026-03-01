import chalk from "chalk"
import { select, confirm } from "@inquirer/prompts"
import { join } from "path"
import { readFile, writeFile, mkdir, rm } from "fs/promises"

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

    const useI18n = await confirm({
      message: chalk.bold.cyan("Use i18n? (@wxt-dev/i18n)"),
      default: false,
    })

    let useContentUI = false
    if (framework === "svelte" || framework === "solid") {
      useContentUI = await confirm({
        message: chalk.bold.cyan("Do you want to use content UI?"),
        default: false,
      })
    }

    // Install i18n dependencies and modify config if user opts in
    const onBeforeInstall = async (projectPath: string) => {
      // Handle Content UI Removal for svelte/solid frameworks if user opts out
      if ((framework === "svelte" || framework === "solid") && !useContentUI) {
        const contentDirPath = join(projectPath, "entrypoints", "content")
        await rm(contentDirPath, { recursive: true, force: true })

        const contentTsPath = join(projectPath, "entrypoints", "content.ts")
        const contentTsContent = `export default defineContentScript({
  matches: ["*://*.google.com/*"],
  main() {
    console.log("Hello content.");
  },
});
`
        await writeFile(contentTsPath, contentTsContent, "utf-8")
      }

      if (!useI18n) return

      const pkgPath = join(projectPath, "package.json")
      const pkgContent = await readFile(pkgPath, "utf-8")
      const pkg = JSON.parse(pkgContent)
      pkg.devDependencies = pkg.devDependencies || {}
      pkg.devDependencies["@wxt-dev/i18n"] = "0.2.5"
      await writeFile(pkgPath, JSON.stringify(pkg, null, 2), "utf-8")

      const wxtConfigPath = join(projectPath, "wxt.config.ts")
      let wxtConfig = await readFile(wxtConfigPath, "utf-8")

      wxtConfig = wxtConfig.replace(
        "manifest: {",
        `manifest: {
    default_locale: "en",`,
      )

      if (wxtConfig.includes("modules: [")) {
        wxtConfig = wxtConfig.replace("modules: [", `modules: ["@wxt-dev/i18n/module", `)
      } else {
        wxtConfig = wxtConfig.replace(
          "export default defineConfig({",
          `export default defineConfig({
  modules: ["@wxt-dev/i18n/module"],`,
        )
      }

      await writeFile(wxtConfigPath, wxtConfig, "utf-8")

      const localesPath = join(projectPath, "locales")
      await mkdir(localesPath, { recursive: true })
      await writeFile(join(localesPath, "en.yml"), "hello: Hello!\n", "utf-8")
    }

    switch (framework) {
      case "svelte":
        await createTemplateProject({ templateName: "wxt-svelte", name, packageManager, onBeforeInstall })
        break
      case "solid":
        await createTemplateProject({ templateName: "wxt-solid", name, packageManager, onBeforeInstall })
        break
      case "vanilla":
        await createTemplateProject({ templateName: "wxt-vanilla", name, packageManager, onBeforeInstall })
        break
      default:
        break
    }
  } catch (error) {
    console.error(error)
  }
}
