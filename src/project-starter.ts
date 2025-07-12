export const projects = ["react-ts","next-ts","wxt-react","wxt-svelte"]

export default function projectStarter(projectName: typeof projects[number]) {
    switch (projectName) {
        case "react-ts":
            console.log("react-ts")
            break;
        case "next-ts":
            console.log("next-ts")
            break;
        case "wxt-react":
            console.log("wxt-react")
            break;
        case "wxt-svelte":
            console.log("wxt-svelte")
            break;
    }
}