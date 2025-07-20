# About Project

- This project is a CLI tool for creating new projects. It is a opinionated project starter.
- User should select a project type and a package manager. Then it will create a new project with pre-configured settings.

- This project uses typescript for development.
- This project itself uses pnpm for package management.
- This project uses tsup for building.
- This project uses ora for cli loading indicators.
- This project uses chalk for cli colors.
- This project uses @inquirer/prompts for prompts.
- This project's npm name is "@kunver/new"
- This project's bin name is "kunver"
- This project's uses vitest for testing.
- This project uses prettier for code formatting.

- Code style should follow prettier rules (.prettierrc.json file).

## React starter plan

- create react project with vite ( using preferred package manager)
- install dependencies
- copy config files
- install tailwind with command
- add tailwind plugin into vite.config.ts
- add tailwindcss import into index.css
- approve builds
- post install react
- delete unnecessary files
- clear files
- edit readme

## Wxt-svelte starter plan

- create wxt project with wxt ( using preferred package manager and selected framework)
- install dependencies
- copy config files
- delete src/assets/svelte.svg file
- delete src/entrypoints/popup/app.css file
- delete `import './app.css';` line in src/entrypoints/popup/main.ts file
- delete src/entrypoints/content.ts file
- create content folder in src/entrypoints
- create App.svelte and index.ts files in src/entrypoints/content

- add this example content ui svelte code into src/entrypoints/content/App.svelte file

```svelte
<script lang="ts">
  let message = "Hello World"
</script>

<h1 class="text-3xl fixed top-20 left-20 z-50">{message}</h1>
```

- add this content ui root code into src/entrypoints/content/index.ts file

```ts
import App from "./App.svelte"
import { mount, unmount } from "svelte"

export default defineContentScript({
  matches: ["<all_urls>"],
  // 2. Set cssInjectionMode
  cssInjectionMode: "ui",

  async main(ctx) {
    // 3. Define your UI
    const ui = await createShadowRootUi(ctx, {
      name: "extension-ui",
      position: "inline",
      anchor: "body",
      onMount: container => {
        // Create the Svelte app inside the UI container
        return mount(App, { target: container })
      },
      onRemove: app => {
        // Destroy the app when the UI is removed
        unmount(app)
      },
    })

    // 4. Mount the UI
    ui.mount()
  },
})
```

- delete src/lib/Counter.svelte file
- run '${packageManager} install tailwindcss @tailwindcss/vite' command
- create 'tailwind.css' file in src/assets folder. add '@import "tailwindcss";' line at top of the file
- add `import tailwindcss from '@tailwindcss/vite'` line at the top of `wxt.config.ts` file
- add this vite object into config object in the `wxt.config.ts` file

```ts
  vite: () => ({
    plugins : [tailwindcss()]
  }),
  webExt : {
    disabled : true
  }
```

- add `import "~/assets/tailwind.css"` to src/entrypoints/popup/main.ts file.
- replace content of src/entrypoints/popup/App.svelte file with this content

```svelte
<script lang="ts">
  let message = "Hello World"
</script>

<h1 class="text-3xl">{message}</h1>
```

- edit readme
- edit package.json, change `name` to `${projectName}`
- approve builds if pnpm or bun
