package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/AlecAivazis/survey/v2"
	"github.com/fatih/color"

	"github.com/brkunver/initer/internal/editor"
	"github.com/brkunver/initer/internal/pipeline"
	"github.com/brkunver/initer/internal/registry"
	"github.com/brkunver/initer/internal/xutil"
)

// version is injected at build time via -ldflags "-X main.version=<semver>".
var version = "0.0.0-dev"

var nameRe = regexp.MustCompile(`^[a-z0-9]+(-[a-z0-9]+)*$`)

var editorOptions = []string{"antigravity", "devin-desktop", "subl", "no", "cursor", "code"}

func main() {
	if err := run(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func run() error {
	fmt.Println(color.GreenString("Kunver v" + color.New(color.Bold).Sprint(version) + "\n"))

	cwd, err := os.Getwd()
	if err != nil {
		return err
	}

	name, err := promptProjectName(cwd)
	if err != nil {
		return err
	}

	projectType, err := promptProjectType()
	if err != nil {
		return err
	}

	starter := registry.ByType(projectType)
	if starter == nil {
		fmt.Println(color.RedString("Project Type Not Implemented"), projectType)
		return nil
	}

	packageManager := "bun"
	if !starter.SkipPMPrompt {
		packageManager, err = promptPackageManager()
		if err != nil {
			return err
		}
	}

	openInEditor, err := promptEditor()
	if err != nil {
		return err
	}

	ctx := context.Background()
	if err := starter.Run(ctx, pipeline.Options{Name: name, PackageManager: packageManager, Cwd: cwd}); err != nil {
		return err
	}

	if openInEditor != "no" {
		editor.OpenInEditor(ctx, name, cwd, openInEditor)
	}

	return nil
}

func promptProjectName(cwd string) (string, error) {
	prompt := &survey.Input{
		Message: "Enter a project name",
		Default: "my-project",
	}
	var answer string
	if err := survey.AskOne(prompt, &answer, survey.WithValidator(func(ans any) error {
		value, ok := ans.(string)
		if !ok || len(strings.TrimSpace(value)) < 2 {
			return fmt.Errorf("Project name must be at least 2 characters")
		}
		if !nameRe.MatchString(value) {
			return fmt.Errorf("Only lowercase letters, numbers, and single hyphens allowed. No spaces or special characters.")
		}
		if xutil.Exists(filepath.Join(cwd, value)) {
			return fmt.Errorf("A folder with that name already exists")
		}
		return nil
	})); err != nil {
		return "", err
	}
	return answer, nil
}

func promptProjectType() (string, error) {
	prompt := &survey.Select{
		Message: "Select a project type",
		Options: registry.TypeNames(),
		Default: "wxt",
	}
	var answer string
	if err := survey.AskOne(prompt, &answer); err != nil {
		return "", err
	}
	return answer, nil
}

func promptPackageManager() (string, error) {
	prompt := &survey.Select{
		Message: "Select a package manager",
		Options: registry.PackageManagers,
		Default: "bun",
	}
	var answer string
	if err := survey.AskOne(prompt, &answer); err != nil {
		return "", err
	}
	return answer, nil
}

func promptEditor() (string, error) {
	available := make([]string, 0, len(editorOptions))
	for _, e := range editorOptions {
		if e == "no" || xutil.CommandExists(e) {
			available = append(available, e)
		}
	}
	if len(available) <= 1 {
		return "no", nil
	}
	prompt := &survey.Select{
		Message: "Open in editor?",
		Options: available,
		Default: "no",
	}
	var answer string
	if err := survey.AskOne(prompt, &answer); err != nil {
		return "", err
	}
	return answer, nil
}
