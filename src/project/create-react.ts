import { spawn } from "node:child_process"

type projectOptions = {
    name: string,
    packageManager: string
}

export function createReactProject(options: projectOptions) {
    const { name, packageManager } = options
    let command : string
    switch (packageManager){
        case "pnpm":
            command = `pnpm create vite ${name} --template react-swc-ts`
            break;
        case "npm":
            command = `npm create vite@latest ${name} -- --template react-swc-ts`
            break;
        case "bun":
            command = `bun create vite ${name} --template react-swc-ts`
            break;
        default:
            command = `pnpm create vite ${name} --template react-swc-ts`
    }
    const child = spawn(command, { shell: true })
    child.stdout.pipe(process.stdout)
    child.stderr.pipe(process.stderr)
    child.on("close", (code) => {
        if (code === 0) {
            console.log(`Created React project at ${name}`)
        } else {
            console.error(`Failed to create React project at ${name}`)
        }
    })
}