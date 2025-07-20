import { rm, mkdir, writeFile, readFile, readdir } from "node:fs/promises"
import { join } from "node:path"
import { spawn } from "node:child_process"
import ora from "ora"
import chalk from "chalk"

export async function postInstallWxt(projectName: string, projectDir: string, packageManager: string) {
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
        unmount(app)
      },
    })
    ui.mount()
  },
})`
    await writeFile(join(contentDir, "index.ts"), indexTsContent)

    // Install Tailwind CSS
    spinner.text = "Installing Tailwind CSS..."
    await new Promise<void>((resolve, reject) => {
      const command = `${packageManager} install tailwindcss @tailwindcss/vite`
      const child = spawn(command, { shell: true, cwd: projectDir })
      child.on("close", code => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error("Failed to install Tailwind CSS"))
        }
      })
    })

    // Create Tailwind CSS file
    spinner.text = "Configuring Tailwind CSS..."
    const tailwindCssContent = `@import "tailwindcss";`
    await writeFile(join(projectDir, "src", "assets", "tailwind.css"), tailw
