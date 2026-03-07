import { existsSync, readdirSync, readFileSync, rmSync } from "node:fs"
import { join } from "node:path"
import { platform } from "node:os"
import { spawn } from "node:child_process"

type CommandName = "help" | "doctor" | "configure" | "build" | "run" | "dev" | "rebuild" | "clean"

type ManagerOptions = {
  config?: string
}

const ROOT_DIR = process.cwd()
const BUILD_DIR = join(ROOT_DIR, "build")
const IS_WINDOWS = platform() === "win32"

function print(message: string) {
  process.stdout.write(`${message}\n`)
}

function printError(message: string) {
  process.stderr.write(`${message}\n`)
}

function getProjectName() {
  const cmakeListsPath = join(ROOT_DIR, "CMakeLists.txt")

  if (!existsSync(cmakeListsPath)) {
    return null
  }

  const cmakeListsContent = readFileSync(cmakeListsPath, "utf-8")
  const match = cmakeListsContent.match(/project\s*\(\s*(?:"([^"]+)"|([^\s\)]+))/i)

  return match?.[1] ?? match?.[2] ?? null
}

function parseArgs(argv: string[]) {
  const [commandArg, ...rest] = argv
  const command = (commandArg ?? "help") as CommandName
  const options: ManagerOptions = {}

  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index]

    if ((arg === "--config" || arg === "-c") && rest[index + 1]) {
      options.config = rest[index + 1]
      index += 1
    }
  }

  return { command, options }
}

function runCommand(command: string, args: string[], cwd = ROOT_DIR) {
  return new Promise<boolean>(resolve => {
    const child = spawn(command, args, {
      cwd,
      stdio: "inherit",
      shell: false,
    })

    child.on("close", code => {
      resolve(code === 0)
    })

    child.on("error", () => {
      resolve(false)
    })
  })
}

async function ensureCmakeAvailable() {
  const ok = await runCommand("cmake", ["--version"])
  if (!ok) {
    printError("CMake not found. Install CMake and ensure it is available in PATH.")
  }
  return ok
}

async function configure() {
  print("Configuring project with CMake...")
  return runCommand("cmake", ["-S", ".", "-B", "build"])
}

async function build(config?: string) {
  print("Building project...")
  const args = ["--build", "build"]

  if (config) {
    args.push("--config", config)
  }

  return runCommand("cmake", args)
}

function getCandidateExecutablePaths(config?: string) {
  const projectName = getProjectName()
  if (!projectName) {
    return []
  }

  const executableName = IS_WINDOWS ? `${projectName}.exe` : projectName
  const requestedConfig = config ? [config] : []
  const commonConfigs = ["Debug", "Release", "RelWithDebInfo", "MinSizeRel"]
  const configDirs = [...requestedConfig, ...commonConfigs]
  const uniqueConfigDirs = [...new Set(configDirs)]

  return [join(BUILD_DIR, executableName), ...uniqueConfigDirs.map(dir => join(BUILD_DIR, dir, executableName))]
}

function findBuiltExecutable(config?: string) {
  const projectName = getProjectName()
  if (!projectName) {
    return null
  }

  for (const candidate of getCandidateExecutablePaths(config)) {
    if (existsSync(candidate)) {
      return candidate
    }
  }

  if (!existsSync(BUILD_DIR)) {
    return null
  }

  const topLevelEntries = readdirSync(BUILD_DIR, { withFileTypes: true })
  for (const entry of topLevelEntries) {
    if (!entry.isDirectory()) {
      continue
    }

    const executableName = IS_WINDOWS ? `${projectName}.exe` : projectName
    const candidate = join(BUILD_DIR, entry.name, executableName)
    if (existsSync(candidate)) {
      return candidate
    }
  }

  return null
}

async function runBuiltApp(config?: string) {
  const executablePath = findBuiltExecutable(config)

  if (!executablePath) {
    printError("Built executable not found. Run `bun manager.ts build` first.")
    return false
  }

  print(`Running ${executablePath} ...`)
  return runCommand(executablePath, [], ROOT_DIR)
}

function clean() {
  if (!existsSync(BUILD_DIR)) {
    print("Build directory does not exist. Nothing to clean.")
    return true
  }

  rmSync(BUILD_DIR, { recursive: true, force: true })
  print("Removed build directory.")
  return true
}

function doctor() {
  print("Checking project structure...")

  const requiredPaths = ["CMakeLists.txt", "src/main.cpp", "src/example.cpp", "include/example.hpp"]
  let ok = true

  for (const requiredPath of requiredPaths) {
    if (!existsSync(join(ROOT_DIR, requiredPath))) {
      printError(`Missing required file: ${requiredPath}`)
      ok = false
    }
  }

  if (!getProjectName()) {
    printError("Could not determine the project name from CMakeLists.txt")
    ok = false
  }

  return ok
}

function printHelp() {
  print("CMake C++ manager")
  print("")
  print("Usage:")
  print("  bun manager.ts <command> [--config Debug]")
  print("")
  print("Commands:")
  print("  help       Show this help message")
  print("  doctor     Check whether required files exist")
  print("  configure  Run `cmake -S . -B build`")
  print("  build      Configure if needed, then build the project")
  print("  run        Run the built executable")
  print("  dev        Configure, build, and run the project")
  print("  rebuild    Remove build directory, then configure and build again")
  print("  clean      Remove the build directory")
}

async function main() {
  const { command, options } = parseArgs(process.argv.slice(2))
  const validCommands: CommandName[] = ["help", "doctor", "configure", "build", "run", "dev", "rebuild", "clean"]

  if (!validCommands.includes(command)) {
    printError(`Unknown command: ${command}`)
    printHelp()
    process.exit(1)
  }

  if (command === "help") {
    printHelp()
    return
  }

  if (command === "doctor") {
    const ok = doctor()
    process.exit(ok ? 0 : 1)
  }

  if (command === "clean") {
    const ok = clean()
    process.exit(ok ? 0 : 1)
  }

  if (!doctor()) {
    process.exit(1)
  }

  if (!(await ensureCmakeAvailable())) {
    process.exit(1)
  }

  if (command === "configure") {
    process.exit((await configure()) ? 0 : 1)
  }

  if (command === "build") {
    if (!existsSync(BUILD_DIR) && !(await configure())) {
      process.exit(1)
    }

    process.exit((await build(options.config)) ? 0 : 1)
  }

  if (command === "run") {
    process.exit((await runBuiltApp(options.config)) ? 0 : 1)
  }

  if (command === "dev") {
    if (!(await configure())) {
      process.exit(1)
    }

    if (!(await build(options.config))) {
      process.exit(1)
    }

    process.exit((await runBuiltApp(options.config)) ? 0 : 1)
  }

  if (command === "rebuild") {
    clean()

    if (!(await configure())) {
      process.exit(1)
    }

    process.exit((await build(options.config)) ? 0 : 1)
  }
}

await main()
