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
    execaMock.mockResolvedValue({})

    await expect(approveBuilds("bun", "sample-app", "/cwd")).resolves.toBe(true)
    expect(execaMock).toHaveBeenCalledWith("bun", ["pm", "trust", "--all"], {
      cwd: join("/cwd", "sample-app"),
    })
  })

  it("approves all pending builds non-interactively for pnpm", async () => {
    execaMock.mockResolvedValue({})

    await expect(approveBuilds("pnpm", "sample-app", "/cwd")).resolves.toBe(true)
    expect(execaMock).toHaveBeenCalledWith("pnpm", ["approve-builds", "--all"], {
      cwd: join("/cwd", "sample-app"),
    })
  })
})
