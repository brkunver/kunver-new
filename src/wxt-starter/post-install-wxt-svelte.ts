import { rm, mkdir, writeFile, readFile } from "node:fs/promises"
import { join } from "node:path"
import { execa } from "execa"
import ora from "ora"
import chalk from "chalk"

export async function postInstallWxtSvelte(projectName: string, projectDir: string, packageManager: string) {
  const spinner = ora("Finalizing WXT Svelte project setup...").start()
  try {
    // Delete unnecessary files
    spinner.text = "Cleaning up default files..."
    await rm(join(projectDir, "src", "assets", "svelte.svg"))
    await rm(join(projectDir, "src", "entrypoints", "popup", "app.css"))
    await rm(join(projectDir, "src", "entrypoints", "content.ts"))
    await rm(join(projectDir, "src", "lib", "Counter.svelte"))

    // Create new content script files
    spinner.text = "Creating content script files..."
    const contentDir = join(projectDir, "src", "entrypoints", "content")
    await mkdir(contentDir)

    const appSvelteContent = `<script lang="ts">
  let message = "Hello World"
</script>

<h1 class="text-3xl fixed top-20 left-20 z-50">{message}</h1>`
    await writeFile(join(contentDir, "App.svelte"), appSvelteContent)

    const indexTsContent = `import App from "./App.svelte"
import { mount, unmount } from "svelte"

export default defineContentScript({
  matches: ["<all_urls>"],
  cssInjectionMode: "ui",

  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: "extension-ui",
      position: "inline",
      anchor: "body",
      onMount: container => {
        return mount(App, { target: container })
      },
      onRemove: app => {
        unmount(app as any)
      },
    })
    ui.mount()
  },
})`
    await writeFile(join(contentDir, "index.ts"), indexTsContent)

    // Install Tailwind CSS
    spinner.text = "Installing Tailwind CSS..."
    const command = `${packageManager} install tailwindcss @tailwindcss/vite`
    await execa(command, { shell: true, cwd: projectDir })

    // Create Tailwind CSS file
    spinner.text = "Configuring Tailwind CSS..."
    const tailwindCssContent = `@import "tailwindcss";`
    await writeFile(join(projectDir, "src", "assets", "tailwind.css"), tailwindCssContent)

    // Update wxt.config.ts
    const wxtConfigPath = join(projectDir, "wxt.config.ts")
    let wxtConfig = await readFile(wxtConfigPath, "utf-8")
    wxtConfig = `import tailwindcss from '@tailwindcss/vite'
` + wxtConfig
    wxtConfig = wxtConfig.replace(
      "defineConfig({",
      "defineConfig({
  vite: () => ({
    plugins: [tailwindcss()]
  }),
  webExt: {
    disabled: true
  },",
    )
    await writeFile(wxtConfigPath, wxtConfig)

    // Update popup entrypoint
    spinner.text = "Updating popup files..."
    const mainTsPath = join(projectDir, "src", "entrypoints", "popup", "main.ts")
    let mainTs = await readFile(mainTsPath, "utf-8")
    mainTs = mainTs.replace("import './app.css'", 'import "~/assets/tailwind.css"')
    await writeFile(mainTsPath, mainTs)

    const popupAppSveltePath = join(projectDir, "src", "entrypoints", "popup", "App.svelte")
    const popupAppSvelteContent = `<script lang="ts">
  let message = "Hello World"
</script>

<h1 class="text-3xl">{message}</h1>`
    await writeFile(popupAppSveltePath, popupAppSvelteContent)

    // Update package.json
    spinner.text = "Updating package.json..."
    const packageJsonPath = join(projectDir, "package.json")
    const packageJson = JSON.parse(await readFile(packageJsonPath, "utf-8"))
    packageJson.name = projectName
    await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2))

    spinner.succeed(chalk.green("WXT Svelte project setup finished successfully!"))
    return true
  } catch (error: any) {
    spinner.fail(chalk.red(`Error during post-installation setup: ${error.message}`))
    return false
  }
}
