export const projects = [
  "react-ts-tw",
  "next-ts-prisma",
  "wxt...",
  "electron-svelte",
  "python-notebook",
  "cpp-makefile",
] as const
export type TprojectType = (typeof projects)[number]

export const packageManagers = ["bun", "pnpm", "npm"] as const
export type TpackageManager = (typeof packageManagers)[number]

export const openInEditorOptions = ["no", "windsurf", "cursor", "code"] as const
export type TopenInEditor = (typeof openInEditorOptions)[number]

export const wxtTemplates = ["svelte", "vanilla"] as const
export type TwxtTemplatesType = (typeof wxtTemplates)[number]
