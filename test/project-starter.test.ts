import { beforeEach, describe, expect, it, vi } from "vitest"

const helpers = vi.hoisted(() => ({
  createWxtProject: vi.fn(),
  createPythonNotebookProject: vi.fn(),
  openInEditor: vi.fn(),
  createTemplateProject: vi.fn(),
  configureCmakeProject: vi.fn(),
  changeCmakeProjectName: vi.fn(),
}))

vi.mock("@/starters", () => ({
  createWxtProject: helpers.createWxtProject,
  createPythonNotebookProject: helpers.createPythonNotebookProject,
}))

vi.mock("@/helpers", () => ({
  openInEditor: helpers.openInEditor,
  createTemplateProject: helpers.createTemplateProject,
  configureCmakeProject: helpers.configureCmakeProject,
  changeCmakeProjectName: helpers.changeCmakeProjectName,
}))

import projectStarter from "@/project-starter"

describe("projectStarter", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("creates a React template project without opening an editor when disabled", async () => {
    await projectStarter({
      projectType: "react-ts-tw",
      packageManager: "pnpm",
      openInEditor: "no",
      name: "sample-app",
    })

    expect(helpers.createTemplateProject).toHaveBeenCalledWith({
      templateName: "react-ts-tw",
      name: "sample-app",
      packageManager: "pnpm",
    })
    expect(helpers.openInEditor).not.toHaveBeenCalled()
  })

  it("wires cmake project hooks and editor opening", async () => {
    await projectStarter({
      projectType: "cmake-cpp",
      packageManager: "pnpm",
      openInEditor: "code",
      name: "Cpp App",
    })

    expect(helpers.createTemplateProject).toHaveBeenCalledTimes(1)

    const templateOptions = helpers.createTemplateProject.mock.calls[0][0]
    expect(templateOptions).toMatchObject({
      templateName: "cmake-cpp",
      name: "Cpp App",
      packageManager: "pnpm",
      addManager: false,
      approveBuild: false,
      installDependency: false,
      changeName: false,
    })

    await templateOptions.onBeforeInstall("/tmp/cmake-app")

    expect(helpers.changeCmakeProjectName).toHaveBeenCalledWith("/tmp/cmake-app", "Cpp App")
    expect(helpers.configureCmakeProject).toHaveBeenCalledWith("/tmp/cmake-app")
    expect(helpers.openInEditor).toHaveBeenCalledWith("Cpp App", process.cwd(), "code")
  })

  it("routes uv notebook projects to the notebook starter", async () => {
    await projectStarter({
      projectType: "uv-notebook",
      packageManager: "pnpm",
      openInEditor: "no",
      name: "data-lab",
    })

    expect(helpers.createPythonNotebookProject).toHaveBeenCalledWith({ name: "data-lab" })
    expect(helpers.createTemplateProject).not.toHaveBeenCalled()
    expect(helpers.openInEditor).not.toHaveBeenCalled()
  })
})
