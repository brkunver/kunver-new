export const projects = ["react-ts","next-ts","wxt-react","wxt-svelte"]
export const packageManagers = ["pnpm","npm","bun"]

export default function projectStarter(projectName: typeof projects[number], packageManager: typeof packageManagers[number]) {
    switch (projectName) {
        case "react-ts":
            console.log("react-ts", packageManager)
            break;
        case "next-ts":
            console.log("next-ts", packageManager)
            break;
        case "wxt-react":
            console.log("wxt-react", packageManager)
            break;
        case "wxt-svelte":
            console.log("wxt-svelte", packageManager)
            break;
    }
}