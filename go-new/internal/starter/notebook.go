package starter

import (
	"context"
	"embed"
	"fmt"
	"io/fs"
	"os"
	"os/exec"
	"path/filepath"

	"github.com/fatih/color"

	"github.com/brkunver/initer/internal/pipeline"
	"github.com/brkunver/initer/internal/xutil"
)

//go:embed embed/uv-notebook/_gitignore
//go:embed embed/uv-notebook/_python-version
//go:embed embed/uv-notebook/main.ipynb
//go:embed embed/uv-notebook/pyproject.toml
//go:embed embed/uv-notebook/README.md
var uvNotebookFS embed.FS

// NotebookFS exposes the embedded uv-notebook template, rooted at the
// template directory.
func NotebookFS() fs.FS {
	sub, err := fs.Sub(uvNotebookFS, "embed/uv-notebook")
	if err != nil {
		return uvNotebookFS
	}
	return sub
}

// RunNotebook scaffolds the uv-notebook starter and runs `uv sync`.
func RunNotebook(ctx context.Context, o pipeline.Options) error {
	projectPath := filepath.Join(o.Cwd, o.Name)
	existedBefore := xutil.Exists(projectPath)

	if err := pipeline.MaterializeTemplate(ctx, pipeline.Source{FS: NotebookFS()}, projectPath); err != nil {
		xutil.CleanupProjectFolder(projectPath, o.Name, existedBefore)
		return fmt.Errorf("Failed to copy uv notebook template: %w", err)
	}

	cmd := exec.CommandContext(ctx, "uv", "sync")
	cmd.Dir = projectPath
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		fmt.Fprintln(os.Stderr, color.RedString("Failed to sync uv dependencies."))
		fmt.Fprintln(os.Stderr, color.YellowString("Please ensure 'uv' is installed: https://docs.astral.sh/uv/getting-started/installation/"))
		xutil.CleanupProjectFolder(projectPath, o.Name, existedBefore)
		return err
	}
	return nil
}
