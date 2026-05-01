const { spawn } = require("child_process")

function runCommand(command) {
  return new Promise(resolve => {
    console.log(`\n> Running: ${command}`)
    const child = spawn(command, { shell: true, stdio: "inherit" })

    child.on("close", code => {
      resolve(code === 0)
    })
  })
}

async function isGitClean() {
  return new Promise(resolve => {
    const { exec } = require("child_process")
    exec("git status --porcelain", (error, stdout) => {
      resolve(stdout.trim() === "")
    })
  })
}

async function publishAndPushOperations(packageManager, command) {
  if (!(await isGitClean())) {
    console.log("❌ Error: You have uncommitted changes. Please commit or stash them before running this script.")
    process.exit(1)
  }

  console.log("\n📦 Switching to main branch...")
  if (!(await runCommand("git checkout main"))) process.exit(1)

  console.log("\n🔄 Pulling latest changes from main...")
  if (!(await runCommand("git pull origin main"))) process.exit(1)

  console.log("\n🔀 Merging dev branch into main...")
  if (!(await runCommand("git merge dev --no-edit"))) {
    console.log("❌ Merge conflict occurred. Please resolve it manually.")
    process.exit(1)
  }

  console.log("\n☁️ Pushing changes to GitHub...")
  if (!(await runCommand("git push origin main --tags"))) {
    console.log("❌ Failed to push changes. Check connection/permissions.")
    process.exit(1)
  }

  console.log("\n✅ Successfully merged 'dev' into 'main' and pushed to GitHub!")

  if (command === "publish") {
    console.log(`\n🚀 Publishing package (${packageManager} publish)...`)
    console.log("⚠️ Important Note: Ensure your package.json version is bumped and NPM_TOKEN is set if needed.\n")

    if (!(await runCommand(`${packageManager} publish`))) {
      console.log(`❌ ${packageManager} publish command failed.`)
    } else {
      console.log(`\n✅ Package published successfully!`)
    }
  }

  console.log("\n🔙 Switching back to dev branch...")
  if (!(await runCommand("git checkout dev"))) {
    console.log("❌ Failed to switch back to the 'dev' branch.")
    process.exit(1)
  }

  console.log("\n🎉 All operations completed successfully.")
}

const packageManagerArg = process.argv[2]
const commandArg = process.argv[3]

const validManagers = ["pnpm"]
const validCommands = ["push", "publish"]

if (!validManagers.includes(packageManagerArg) || !validCommands.includes(commandArg)) {
  console.log(
    `❌ Invalid or missing arguments. \nUsage: node manager.cjs <package-manager> <push|publish>\nValid package managers: ${validManagers.join(
      ", ",
    )}`,
  )
  process.exit(1)
}

publishAndPushOperations(packageManagerArg, commandArg)
