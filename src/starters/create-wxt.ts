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

type WxtCustomizationOptions = {
  useI18n: boolean
  useContentUI: boolean
}

const WXT_TEMPLATE_MAP: Record<constant.TwxtTemplatesType, string> = {
  svelte: "wxt-svelte",
  solid: "wxt-solid",
  vanilla: "wxt-vanilla",
}

async function resolveFrameworkSelection(selectedFramework?: constant.TwxtTemplatesType) {
  if (selectedFramework && constant.wxtTemplates.includes(selectedFramework)) {
    return selectedFramework
  }

  return (await select({
    message: chalk.bold.magenta("Select a framework for WXT"),
    choices: constant.wxtTemplates.map(framework => ({
      name: framework.charAt(0).toUpperCase() + framework.slice(1),
      value: framework,
    })),
    default: "svelte",
  })) as constant.TwxtTemplatesType
}

async function resolveCustomizationOptions(framework: constant.TwxtTemplatesType): Promise<WxtCustomizationOptions> {
  const useI18n = await confirm({
    message: chalk.bold.cyan("Use i18n? (@wxt-dev/i18n)"),
    default: false,
  })

  const supportsContentUI = framework === "svelte" || framework === "solid"
  const useContentUI = supportsContentUI
    ? await confirm({
        message: chalk.bold.cyan("Do you want to use content UI?"),
        default: false,
      })
    : false

  return {
    useI18n,
    useContentUI,
  }
}

async function removeContentUi(projectPath: string) {
  const contentDirPath = join(projectPath, "entrypoints", "content")
  const contentTsPath = join(projectPath, "entrypoints", "content.ts")
  const contentTsContent = `export default defineContentScript({
  matches: ["*://*.google.com/*"],
  main() {
    console.log("Hello content.");
  },
});
`

  await rm(contentDirPath, { recursive: true, force: true })
  await writeFile(contentTsPath, contentTsContent, "utf-8")
}

async function applyI18n(projectPath: string) {
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

function createOnBeforeInstall(framework: constant.TwxtTemplatesType, customization: WxtCustomizationOptions) {
  return async (projectPath: string) => {
    const shouldReplaceContentUi = (framework === "svelte" || framework === "solid") && !customization.useContentUI

    if (shouldReplaceContentUi) {
      await removeContentUi(projectPath)
    }

    if (customization.useI18n) {
      await applyI18n(projectPath)
    }
  }
}

export async function createWxtProject(options: projectOptions) {
  const { name, packageManager, selectedFramework } = options

  try {
    const framework = await resolveFrameworkSelection(selectedFramework)
    const customization = await resolveCustomizationOptions(framework)

    await createTemplateProject({
      templateName: WXT_TEMPLATE_MAP[framework],
      name,
      packageManager,
      onBeforeInstall: createOnBeforeInstall(framework, customization),
    })
  } catch (error) {
    console.error(error)
    throw error
  }
}
