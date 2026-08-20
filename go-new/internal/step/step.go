package step

import (
	"context"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"github.com/briandowns/spinner"
	"github.com/fatih/color"

	"github.com/brkunver/initer/internal/xutil"
)

var resizeCommands = map[string]string{
	"pnpm": "pnpm dlx @kunver/resize",
	"npm":  "npx @kunver/resize",
	"bun":  "bunx @kunver/resize",
}

var trustedDepRe = regexp.MustCompile(`^\s{2}(.+?):\s*true\s*$`)
var alreadyTrustedRe = regexp.MustCompile(`(?i)already trusted|0 scripts ran`)

// ConfigurePackageManager rewrites package.json scripts for the chosen package
// manager and translates pnpm-workspace.yaml approvals for bun.
func ConfigurePackageManager(ctx context.Context, pm, projectPath string) error {
	pkgPath := filepath.Join(projectPath, "package.json")
	pkg, err := xutil.ReadJSON(pkgPath)
	if err != nil {
		return err
	}

	scripts, _ := pkg["scripts"].(map[string]any)
	if scripts == nil {
		scripts = map[string]any{}
		pkg["scripts"] = scripts
	}
	if pm == "bun" {
		scripts["manager"] = "bun manager.cjs bun"
	} else {
		scripts["manager"] = "node manager.cjs " + pm
	}
	if _, ok := scripts["resize"]; ok {
		scripts["resize"] = resizeCommands[pm]
	}
	if _, ok := scripts["zip:all"]; ok {
		if pm == "bun" {
			scripts["zip:all"] = "bun --parallel zip zip:firefox"
		} else {
			scripts["zip:all"] = "wxt zip && wxt zip -b firefox"
		}
	}
	if pm != "bun" {
		delete(pkg, "trustedDependencies")
	}

	if pm == "bun" {
		if content, err := os.ReadFile(filepath.Join(projectPath, "pnpm-workspace.yaml")); err == nil {
			deps := parseTrustedDependencies(string(content))
			if len(deps) > 0 {
				pkg["trustedDependencies"] = deps
			}
		}
	}

	if err := xutil.WriteJSON(pkgPath, pkg); err != nil {
		return err
	}

	if pm != "pnpm" {
		os.Remove(filepath.Join(projectPath, "pnpm-workspace.yaml"))
	}
	return nil
}

func parseTrustedDependencies(content string) []string {
	var deps []string
	for _, line := range strings.Split(content, "\n") {
		line = strings.TrimRight(line, "\r")
		m := trustedDepRe.FindStringSubmatch(line)
		if m == nil {
			continue
		}
		deps = append(deps, strings.Trim(m[1], `"'`))
	}
	return deps
}

// InstallDependencies runs `<pm> install` in the project directory.
func InstallDependencies(ctx context.Context, pm, name, cwd string) error {
	fmt.Printf("Installing dependencies with %s\n\n", color.CyanString(pm))
	cmd := exec.CommandContext(ctx, pm, "install")
	cmd.Dir = filepath.Join(cwd, name)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		return errors.New("Failed to install dependencies")
	}
	return nil
}

// ApproveBuilds approves build scripts non-interactively for pnpm and bun.
func ApproveBuilds(ctx context.Context, pm, name, cwd string) bool {
	switch pm {
	case "pnpm":
		return pnpmApproveBuilds(ctx, name, cwd)
	case "bun":
		return bunApproveBuilds(ctx, name, cwd)
	default:
		return true
	}
}

func pnpmApproveBuilds(ctx context.Context, name, cwd string) bool {
	projectPath := filepath.Join(cwd, name)
	sp := newSpinner("Approving builds for " + color.BlueString(name))
	sp.Start()

	cmd := exec.CommandContext(ctx, "pnpm", "approve-builds", "--all")
	cmd.Dir = projectPath
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		sp.FinalMSG = color.RedString("✖") + " Failed to approve builds for " + color.BlueString(name) + "\n"
		sp.Stop()
		return false
	}
	sp.FinalMSG = color.GreenString("✔") + " Approved builds for " + color.BlueString(name) + "\n"
	sp.Stop()
	return true
}

func bunApproveBuilds(ctx context.Context, name, cwd string) bool {
	projectPath := filepath.Join(cwd, name)
	sp := newSpinner("Approving builds for " + color.BlueString(name))
	sp.Start()

	cmd := exec.CommandContext(ctx, "bun", "pm", "trust", "--all")
	cmd.Dir = projectPath
	out, err := cmd.CombinedOutput()

	// bun exits with code 1 when the dependencies were already trusted.
	alreadyTrusted := alreadyTrustedRe.Match(out)
	if err != nil && !alreadyTrusted {
		sp.FinalMSG = color.RedString("✖") + " Failed to approve builds for " + color.BlueString(name) + "\n"
		sp.Stop()
		return false
	}
	sp.FinalMSG = color.GreenString("✔") + " Approved builds for " + color.BlueString(name) + "\n"
	sp.Stop()
	return true
}

func newSpinner(suffix string) *spinner.Spinner {
	sp := spinner.New(spinner.CharSets[9], 100*time.Millisecond)
	sp.Suffix = " " + suffix
	return sp
}

// ChangeProjectName sets the package.json name from the project name,
// lowercasing it and replacing whitespace runs with hyphens.
func ChangeProjectName(ctx context.Context, projectPath, newName string) error {
	pkgPath := filepath.Join(projectPath, "package.json")
	pkg, err := xutil.ReadJSON(pkgPath)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error updating project name: %v\n", err)
		return errors.New("Failed to change project name")
	}
	name := strings.ToLower(newName)
	name = regexp.MustCompile(`\s+`).ReplaceAllString(name, "-")
	pkg["name"] = name
	if err := xutil.WriteJSONNL(pkgPath, pkg); err != nil {
		fmt.Fprintf(os.Stderr, "Error updating project name: %v\n", err)
		return errors.New("Failed to change project name")
	}
	return nil
}
