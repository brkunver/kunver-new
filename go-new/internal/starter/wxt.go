package starter

import (
	"context"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/AlecAivazis/survey/v2"

	"github.com/brkunver/initer/internal/pipeline"
	"github.com/brkunver/initer/internal/template"
	"github.com/brkunver/initer/internal/xutil"
)

// MakeRunWxt builds the wxt starter flow bound to the template repos in the
// registry.
func MakeRunWxt(repos map[string]template.Repo) func(ctx context.Context, o pipeline.Options) error {
	return func(ctx context.Context, o pipeline.Options) error {
		framework, err := selectFramework()
		if err != nil {
			return err
		}

		useI18n, err := confirmYesNo("Use i18n? (@wxt-dev/i18n)", false)
		if err != nil {
			return err
		}
		useContentUI := false
		if framework == "svelte" || framework == "solid" {
			useContentUI, err = confirmYesNo("Do you want to use content UI?", false)
			if err != nil {
				return err
			}
		}
		useWxtStorage, err := confirmYesNo("Do you want to use wxt-storage?", false)
		if err != nil {
			return err
		}

		repo, ok := repos[framework]
		if !ok {
			return fmt.Errorf("unknown WXT framework: %s", framework)
		}

		return pipeline.CreateProject(ctx, pipeline.Spec{
			Name:            o.Name,
			PackageManager:  o.PackageManager,
			Cwd:             o.Cwd,
			Source:          pipeline.Source{Repo: &repo},
			AddManager:      true,
			InstallDeps:     true,
			ApproveBuild:    true,
			ChangeName:      true,
			OnBeforeInstall: prepareWxt(framework, useI18n, useContentUI, useWxtStorage),
		})
	}
}

func selectFramework() (string, error) {
	prompt := &survey.Select{
		Message: "Select a framework for WXT",
		Options: []string{"Svelte", "Vanilla", "Solid"},
		Default: "Svelte",
	}
	var answer string
	if err := survey.AskOne(prompt, &answer); err != nil {
		return "", err
	}
	return strings.ToLower(answer), nil
}

func confirmYesNo(message string, def bool) (bool, error) {
	prompt := &survey.Confirm{Message: message, Default: def}
	var answer bool
	if err := survey.AskOne(prompt, &answer); err != nil {
		return false, err
	}
	return answer, nil
}

func prepareWxt(framework string, useI18n, useContentUI, useWxtStorage bool) func(ctx context.Context, projectPath string) error {
	return func(ctx context.Context, projectPath string) error {
		if (framework == "svelte" || framework == "solid") && !useContentUI {
			if err := removeContentUI(projectPath); err != nil {
				return err
			}
		}
		if useI18n {
			if err := applyI18n(projectPath); err != nil {
				return err
			}
		}
		if useWxtStorage {
			if err := applyWxtStorage(projectPath); err != nil {
				return err
			}
		}
		return nil
	}
}

// PrepareWxt exposes the wxt post-copy hook for reuse and testing.
func PrepareWxt(framework string, useI18n, useContentUI, useWxtStorage bool) func(ctx context.Context, projectPath string) error {
	return prepareWxt(framework, useI18n, useContentUI, useWxtStorage)
}

const defaultContentScript = `export default defineContentScript({
  matches: ["*://*.google.com/*"],
  main() {
    console.log("Hello content.");
  },
});
`

func removeContentUI(projectPath string) error {
	if err := os.RemoveAll(filepath.Join(projectPath, "entrypoints", "content")); err != nil {
		return err
	}
	return os.WriteFile(filepath.Join(projectPath, "entrypoints", "content.ts"), []byte(defaultContentScript), 0o644)
}

func applyI18n(projectPath string) error {
	pkgPath := filepath.Join(projectPath, "package.json")
	pkg, err := xutil.ReadJSON(pkgPath)
	if err != nil {
		return err
	}
	devDeps, _ := pkg["devDependencies"].(map[string]any)
	if devDeps == nil {
		devDeps = map[string]any{}
		pkg["devDependencies"] = devDeps
	}
	devDeps["@wxt-dev/i18n"] = "^0.2.7"
	if err := xutil.WriteJSON(pkgPath, pkg); err != nil {
		return err
	}

	wxtConfigPath := filepath.Join(projectPath, "wxt.config.ts")
	cfg, err := os.ReadFile(wxtConfigPath)
	if err != nil {
		return err
	}
	content := string(cfg)

	content = strings.Replace(content, "manifest: {", "manifest: {\n    default_locale: \"en\",", 1)

	if strings.Contains(content, "modules: [") {
		content = strings.Replace(content, "modules: [", "modules: [\"@wxt-dev/i18n/module\", ", 1)
	} else {
		content = strings.Replace(content, "export default defineConfig({", "export default defineConfig({\n  modules: [\"@wxt-dev/i18n/module\"],", 1)
	}

	if err := os.WriteFile(wxtConfigPath, []byte(content), 0o644); err != nil {
		return err
	}

	localesDir := filepath.Join(projectPath, "locales")
	if err := os.MkdirAll(localesDir, 0o755); err != nil {
		return err
	}
	return os.WriteFile(filepath.Join(localesDir, "en.yml"), []byte("hello: Hello!\n"), 0o644)
}

func applyWxtStorage(projectPath string) error {
	wxtConfigPath := filepath.Join(projectPath, "wxt.config.ts")
	cfg, err := os.ReadFile(wxtConfigPath)
	if err != nil {
		return err
	}
	content := string(cfg)

	if !strings.Contains(content, `permissions: ["storage"]`) {
		updated, ok := insertManifestPermission(content)
		if !ok {
			return errors.New("Could not add storage permission to wxt.config.ts")
		}
		if err := os.WriteFile(wxtConfigPath, []byte(updated), 0o644); err != nil {
			return err
		}
	}

	utilsDir := filepath.Join(projectPath, "utils")
	if err := os.MkdirAll(utilsDir, 0o755); err != nil {
		return err
	}
	const storageExample = `// Example WXT Storage usage:
// import { storage } from "#imports"
//
// const showChangelogOnUpdate = storage.defineItem<boolean>("local:showChangelogOnUpdate", {
//   fallback: true,
// })
`
	return os.WriteFile(filepath.Join(utilsDir, "storage.ts"), []byte(storageExample), 0o644)
}

// insertManifestPermission adds `permissions: ["storage"],` to the manifest
// object by scanning for its matching closing brace.
func insertManifestPermission(text string) (string, bool) {
	idx := strings.Index(text, "manifest: {")
	if idx == -1 {
		return text, false
	}
	braceIdx := strings.Index(text[idx:], "{")
	if braceIdx == -1 {
		return text, false
	}
	open := idx + braceIdx

	depth := 0
	end := -1
	for i := open; i < len(text); i++ {
		switch text[i] {
		case '{':
			depth++
		case '}':
			depth--
			if depth == 0 {
				end = i
				break
			}
		}
	}
	if end == -1 {
		return text, false
	}

	lineStart := strings.LastIndex(text[:end], "\n")
	indent := ""
	if lineStart != -1 {
		for i := lineStart + 1; i < end; i++ {
			if text[i] == ' ' || text[i] == '\t' {
				indent += string(text[i])
			} else {
				break
			}
		}
	}
	insertion := "\n" + indent + "  permissions: [\"storage\"],"
	return text[:end] + insertion + text[end:], true
}
