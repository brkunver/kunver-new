package editor

import (
	"context"
	"fmt"
	"os"
	"os/exec"

	"github.com/fatih/color"
)

// OpenInEditor opens the project in the given editor.
func OpenInEditor(ctx context.Context, projectName, cwd, editor string) error {
	fmt.Println(color.WhiteString("Opening ") + color.BlueString(projectName) + color.WhiteString(" in ") + color.GreenString(editor))
	cmd := exec.CommandContext(ctx, editor, projectName)
	cmd.Dir = cwd
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		fmt.Fprintf(os.Stderr, "%s: %v\n", color.RedString("Failed to open project in editor"), err)
		return err
	}
	return nil
}
