import { join } from "path"
import { beforeEach, describe, expect, it, vi } from "vitest"

const execaMock = vi.hoisted(() => vi.fn())

vi.mock("execa", () => ({
  execa: execaMock,
}))

import approveBuilds from "@/helpers/approve"

describe("approveBuilds", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("is a no-op for npm", async () => {
    await expect(approveBuilds("npm", "sample-app", "/cwd")).resolves.toBe(true)
    expect(execaMock).not.toHaveBeenCalled()
  })

  it("approves builds via bun trust for bun", async () => {
    execaMock.mockResolvedValue({ exitCode: 0, stderr: "" })

    await expect(approveBuilds("bun", "sample-app", "/cwd")).resolves.toBe(true)
    expect(execaMock).toHaveBeenCalledWith("bun", ["pm", "trust", "--all"], {
      cwd: join("/cwd", "sample-app"),
      reject: false,
    })
  })

  it("treats already-trusted exit code 1 as success for bun", async () => {
    execaMock.mockResolvedValue({
      exitCode: 1,
      stderr: "error: 0 scripts ran. This means all dependencies are already trusted or none have scripts.",
    })

    await expect(approveBuilds("bun", "sample-app", "/cwd")).resolves.toBe(true)
  })

  it("fails for bun when trust errors for another reason", async () => {
    execaMock.mockResolvedValue({ exitCode: 1, stderr: "error: something went wrong" })

    await expect(approveBuilds("bun", "sample-app", "/cwd")).resolves.toBe(false)
  })

  it("approves all pending builds non-interactively for pnpm", async () => {
    execaMock.mockResolvedValue({})

    await expect(approveBuilds("pnpm", "sample-app", "/cwd")).resolves.toBe(true)
    expect(execaMock).toHaveBeenCalledWith("pnpm", ["approve-builds", "--all"], {
      cwd: join("/cwd", "sample-app"),
    })
  })
})
