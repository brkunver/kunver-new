// install tailwind helper
import { readFileSync, writeFileSync } from "fs"
import { spawn } from "node:child_process"

function editViteConfig(){
    const path = "vite.config.ts"
    // open vite.config.ts file
    let viteConfig = readFileSync(path, "utf-8")
    viteConfig = 'import tailwindcss from "@tailwindcss/vite"\n' + viteConfig
    writeFileSync(path, viteConfig)
}

export function installTailwind(packageManager: string) : boolean {
    let command = packageManager + " install tailwindcss @tailwindcss/vite"
    const child = spawn(command, { shell: true ,cwd: process.cwd()})
    child.stdout.pipe(process.stdout)
    child.stderr.pipe(process.stderr)
    child.on("close", (code) => {
        if (code === 0) {
            console.log(`Installed tailwind`)
            return true
        } else {
            console.error(`Failed to install tailwind`)
            return false
        }
    })
    return true
}