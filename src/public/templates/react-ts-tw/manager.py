import subprocess
import sys

def run_command(command):
    """
    Runs the specified command and checks its output.
    Exits the program if an error occurs.
    """
    try:
        # Run the command and capture output
        result = subprocess.run(
            command,
            check=True,  # Raise an error if the command returns a non-zero exit code
            shell=True,  # Run the command in the shell (needed for features like pipes)
            capture_output=True,  # Capture standard output and error
            text=True  # Get output as text
        )
        print(result.stdout.strip()) # Print successful output
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error occurred: {e}")
        print(f"Standard Error: {e.stderr.strip()}")
        return False
    except FileNotFoundError:
        print(f"❌ Command not found: '{command.split()[0]}'. Please check your PATH.")
        return False

def publish_and_push_operations(command):
    """
    Executes the sequence of Git and pnpm operations for publishing and pushing.
    This function consolidates all steps from the original .sh file.
    """
    print("Switching to main branch...")
    if not run_command("git checkout main"):
        sys.exit(1)

    print("Merging dev branch into main...")
    if not run_command("git merge dev"):
        print("❌ Merge conflict occurred. Please resolve it manually.")
        sys.exit(1)

    print("Pushing changes to GitHub...")
    if not run_command("git push origin main"):
        print("❌ Failed to push changes to GitHub. Please check your network connection and permissions.")
        sys.exit(1)

    print("✅ Successfully merged 'dev' into 'main' and pushed to GitHub!")

    if command == "publish":
        print("Publishing package (pnpm publish)...")
        if not run_command("pnpm publish"):
            print("❌ pnpm publish command failed.")
            sys.exit(1)

    print("Switching back to dev branch...")
    if not run_command("git checkout dev"):
        print("❌ Failed to switch back to the 'dev' branch.")
        sys.exit(1)

    print("✅ All operations completed.")

if __name__ == "__main__":
    # Check if a command is provided (e.g., 'push' or 'publish')
    if len(sys.argv) > 1:
        # sys.argv[1] is now directly the command (e.g., 'push' or 'publish')
        command_arg = sys.argv[1]
        if command_arg == "push" or command_arg == "publish":
            publish_and_push_operations(command_arg)
        else:
            print(f"Invalid command: '{command_arg}'. Usage: python manager.py [push|publish]")
    else:
        print("No command provided. Usage: python manager.py [push|publish]")