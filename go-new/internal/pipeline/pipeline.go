package pipeline

import (
	"context"
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"time"

	"github.com/briandowns/spinner"
	"github.com/fatih/color"

	"github.com/brkunver/initer/internal/step"
	"github.com/brkunver/initer/internal/template"
	"github.com/brkunver/initer/internal/xutil"
)

// Options carries the choices made in the main prompt flow.
type Options struct {
	Name           string
	PackageManager string
	Cwd            string
}

// Source is a materialized template: either a GitHub template repo or an
// embedded filesystem.
type Source struct {
	Repo *template.Repo
	FS   fs.FS
}

// Spec configures one scaffolded project.
type Spec struct {
	Name            string
	PackageManager  string
	Cwd             string
	Source          Source
	AddManager      bool
	InstallDeps     bool
	ApproveBuild    bool
	ChangeName      bool
	OnBeforeInstall func(ctx context.Context, projectPath string) error
}

// CreateProject runs the shared scaffold pipeline and cleans up on failure.
func CreateProject(ctx context.Context, spec Spec) error {
	projectPath := filepath.Join(spec.Cwd, spec.Name)
	existedBefore := xutil.Exists(projectPath)

	if err := run(ctx, spec, projectPath); err != nil {
		fmt.Fprintf(os.Stderr, "Error creating project: %v\n", err)
		xutil.CleanupProjectFolder(projectPath, spec.Name, existedBefore)
		return err
	}
	return nil
}

func run(ctx context.Context, spec Spec, projectPath string) error {
	if err := MaterializeTemplate(ctx, spec.Source, projectPath); err != nil {
		return err
	}

	if spec.OnBeforeInstall != nil {
		if err := spec.OnBeforeInstall(ctx, projectPath); err != nil {
			return err
		}
	}

	if spec.AddManager {
		if err := step.ConfigurePackageManager(ctx, spec.PackageManager, projectPath); err != nil {
			return err
		}
	}

	if spec.InstallDeps {
		if err := step.InstallDependencies(ctx, spec.PackageManager, spec.Name, spec.Cwd); err != nil {
			return err
		}
	}

	if spec.ApproveBuild {
		if !step.ApproveBuilds(ctx, spec.PackageManager, spec.Name, spec.Cwd) {
			return errors.New("Failed to approve builds")
		}
	}

	if spec.ChangeName {
		if err := step.ChangeProjectName(ctx, projectPath, spec.Name); err != nil {
			return err
		}
	}

	return nil
}

// MaterializeTemplate copies a template source into dst and restores
// underscore-prefixed dotfiles, reporting progress with a spinner.
func MaterializeTemplate(ctx context.Context, src Source, dst string) error {
	sp := spinner.New(spinner.CharSets[9], 100*time.Millisecond)
	sp.Suffix = " Copying template folder..."
	sp.Start()

	err := materialize(ctx, src, dst)
	if err != nil {
		sp.FinalMSG = color.RedString("✖") + " Failed to copy template folder\n"
		sp.Stop()
		return err
	}
	sp.FinalMSG = color.GreenString("✔") + " Copied template folder\n"
	sp.Stop()
	return nil
}

func materialize(ctx context.Context, src Source, dst string) error {
	switch {
	case src.Repo != nil:
		if err := template.DownloadRepo(ctx, *src.Repo, dst); err != nil {
			return fmt.Errorf("Failed to download template: %w", err)
		}
		return template.RestoreDotfiles(dst)
	case src.FS != nil:
		if err := template.WriteFS(src.FS, dst); err != nil {
			return errors.New("Failed to copy template folder")
		}
		return template.RestoreDotfiles(dst)
	default:
		return errors.New("Failed to copy template folder")
	}
}
