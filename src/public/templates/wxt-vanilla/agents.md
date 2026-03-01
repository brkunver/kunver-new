- This is a Web Extension Project
- Goal : Create timestamps and chapters for youtube video using AI

- This project uses wxt framework for development. wxt is a extension development framework.
- website to framework is : https://wxt.dev/
- you can find docs on these websites :

1. https://wxt.dev//knowledge/docs.txt
2. https://wxt.dev//knowledge/api-reference.txt

- use browser super global whenever you want to use chrome global. wxt uses browser global for development
  for example:
  browser.runtime.getURL() instead of chrome.runtime.getURL()

## Manifest :

In WXT, there is no manifest.json file in your source code. Instead, WXT generates the manifest from multiple sources:

Global options defined in wxt.config.ts file
Entrypoint-specific options defined in your entrypoints
WXT Modules added to your project can modify your manifest
Hooks defined in your project can modify your manifest
Your extension's manifest.json will be output to .output/{target}/manifest.json when running wxt build.

- this extension aims manifest v3
- this project uses typescript for development.
- this project uses prettier for code formatting.
- this project uses vite.
- this project uses bun package manager, not npm.
- I should have a .prettierrc.json file in the root directory. please also follow rules on that.

- entrypoints are in src/entrypoints directory

## Storage

- When we need storage we should use WXT Storage, you should import it from "#imports".
- Please check project if I already defined a store
- use "local:" prefix when storing data locally

## Storage

- When we need storage we should use WXT Storage, you should import it from "#imports".
- Please check project if I already defined a store
- use "local:" prefix when storing data locally

```ts
// utils/storage.ts
import { storage } from "#imports"
const showChangelogOnUpdate = storage.defineItem<boolean>("local:showChangelogOnUpdate", {
  fallback: true,
})

// usage
await showChangelogOnUpdate.getValue()
await showChangelogOnUpdate.setValue(false)
await showChangelogOnUpdate.removeValue()
const unwatch = showChangelogOnUpdate.watch(newValue => {
  // ...
})
```

## i18n usage

- when needed, use @wxt-dev/i18n, and import from "#i18n"
- translations will be in <srcDir>/locales/ directory, and will be yml files.

- usage example

```ts
import { i18n } from "#i18n"

i18n.t("helloWorld") // "Hello world!"
```
