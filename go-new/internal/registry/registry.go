// Package registry is the single extension point for starters. Every starter
// and every external template repo URL is listed here.
package registry

import (
	"context"

	"github.com/brkunver/initer/internal/pipeline"
	"github.com/brkunver/initer/internal/starter"
	"github.com/brkunver/initer/internal/template"
)

// Template repos. If a repo is renamed/moved or a ref needs pinning, edit here.
var wxtTemplateRepos = map[string]template.Repo{
	"svelte":  {Owner: "brkunver", Repo: "wxt-svelte-template", Ref: "main"},
	"vanilla": {Owner: "brkunver", Repo: "wxt-vanilla-template", Ref: "main"},
	"solid":   {Owner: "brkunver", Repo: "wxt-solid-template", Ref: "main"},
}

// PackageManagers is the package-manager prompt choices.
var PackageManagers = []string{"pnpm", "npm", "bun"}

// Starters is the single source of truth for the project-type prompt and the
// dispatch table. Add or remove a starter here.
var Starters = []Starter{
	{Type: "wxt", Run: starter.MakeRunWxt(wxtTemplateRepos)},
	{Type: "uv-notebook", Run: starter.RunNotebook, SkipPMPrompt: true},
	{Type: "cmake-cpp", Run: starter.RunCmake, SkipPMPrompt: true},
}

// Starter describes one project type.
type Starter struct {
	Type string
	// SkipPMPrompt is true for starters that never need a package manager.
	SkipPMPrompt bool
	Run          func(ctx context.Context, o pipeline.Options) error
}

// TypeNames returns the project-type choices in order.
func TypeNames() []string {
	names := make([]string, 0, len(Starters))
	for _, s := range Starters {
		names = append(names, s.Type)
	}
	return names
}

// ByType returns the starter for a project type, or nil.
func ByType(t string) *Starter {
	for i := range Starters {
		if Starters[i].Type == t {
			return &Starters[i]
		}
	}
	return nil
}
