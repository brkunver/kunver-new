const { exec } = require("child_process")

function runCommand(command) {
    return new Promise((resolve, reject) => {
        exec(command, { shell: true }, (error, stdout, stderr) => {
            if (error) {
                console.log(`❌ Error occurred: ${error.message}`)
                if (stderr) {
                    console.log(`Standard Error: ${stderr.trim()}`)
                }
                return resolve(false)
            }
            if (stdout) {
                console.log(stdout.trim())
            }
            resolve(true)
        })
    })
}

async function publishAndPushOperations(command) {
    console.log("Switching to main branch...")
    if (!await runCommand("git checkout main")) {
        process.exit(1)
    }

    console.log("Merging dev branch into main...")
    if (!await runCommand("git merge dev")) {
        console.log("❌ Merge conflict occurred. Please resolve it manually.")
        process.exit(1)
    }

    console.log("Pushing changes to GitHub...")
    if (!await runCommand("git push origin main")) {
        console.log("❌ Failed to push changes to GitHub. Please check your network connection and permissions.")
        process.exit(1)
    }

    console.log("✅ Successfully merged 'dev' into 'main' and pushed to GitHub!")

    if (command === "publish") {
        console.log("Publishing package (pnpm publish)...")
        if (!await runCommand("pnpm publish")) {
            console.log("❌ pnpm publish command failed.")
            process.exit(1)
        }
    }

    console.log("Switching back to dev branch...")
    if (!await runCommand("git checkout dev")) {
        console.log("❌ Failed to switch back to the 'dev' branch.")
        process.exit(1)
    }

    console.log("✅ All operations completed.")
}

const commandArg = process.argv[2]

if (commandArg === "push" || commandArg === "publish") {
    publishAndPushOperations(commandArg)
} else {
    console.log(`Invalid or missing command: '${commandArg || ""}'. Usage: node manager.js [push|publish]`)
}
