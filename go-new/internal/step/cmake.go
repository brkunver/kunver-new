package step

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"

	"github.com/fatih/color"
)

var cmakeProjectRe = regexp.MustCompile(`(?i)project\s*\(\s*(?:"[^"]+"|[^\s\)]+)([\s\S]*?)\)`)

// ChangeCmakeProjectName rewrites the CMake project(...) call with the new name.
func ChangeCmakeProjectName(ctx context.Context, projectPath, newName string) error {
	path := filepath.Join(projectPath, "CMakeLists.txt")
	content, err := os.ReadFile(path)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error updating CMake project name: %v\n", err)
		return err
	}
	updated := cmakeProjectRe.ReplaceAllString(string(content), `project("`+newName+`"$1)`)
	if updated == string(content) {
		return nil
	}
	return os.WriteFile(path, []byte(updated), 0o644)
}

// ConfigureCmakeProject runs `cmake -S . -B build`. A failure is reported but
// does not abort the run.
func ConfigureCmakeProject(ctx context.Context, projectPath string) error {
	fmt.Print(color.WhiteString("Configuring CMake project in ") + color.BlueString(projectPath) + "\n")

	cmd := exec.CommandContext(ctx, "cmake", "-S", ".", "-B", "build")
	cmd.Dir = projectPath
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		fmt.Println(color.YellowString("Automatic CMake configure skipped. Run `cmake -S . -B build` manually if needed."))
		return nil
	}
	fmt.Println(color.GreenString("CMake project configured successfully"))
	return nil
}
