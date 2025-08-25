import * as constant from "@/constant"

type projectOptions = {
    name: string
    packageManager: constant.TpackageManager
    cwd?: string
}

export async function createElectronSvelteProject(options: projectOptions) {
    const { name, packageManager, cwd = process.cwd() } = options
    
}
