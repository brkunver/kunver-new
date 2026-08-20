package starter

import (
	"context"
	"embed"
	"io/fs"

	"github.com/brkunver/initer/internal/pipeline"
	"github.com/brkunver/initer/internal/step"
)

//go:embed embed/cmake-cpp/_clang-format
//go:embed embed/cmake-cpp/_gitignore
//go:embed embed/cmake-cpp/agents.md
//go:embed embed/cmake-cpp/CMakeLists.txt
//go:embed embed/cmake-cpp/include/example.hpp
//go:embed embed/cmake-cpp/manager.cjs
//go:embed embed/cmake-cpp/README.md
//go:embed embed/cmake-cpp/src/example.cpp
//go:embed embed/cmake-cpp/src/main.cpp
var cmakeCPPFS embed.FS

// CmakeFS exposes the embedded cmake-cpp template, rooted at the template
// directory.
func CmakeFS() fs.FS {
	sub, err := fs.Sub(cmakeCPPFS, "embed/cmake-cpp")
	if err != nil {
		return cmakeCPPFS
	}
	return sub
}

// RunCmake scaffolds the cmake-cpp starter, renames the CMake project and
// configures it with CMake.
func RunCmake(ctx context.Context, o pipeline.Options) error {
	return pipeline.CreateProject(ctx, pipeline.Spec{
		Name:            o.Name,
		PackageManager:  "bun",
		Cwd:             o.Cwd,
		Source:          pipeline.Source{FS: CmakeFS()},
		AddManager:      false,
		InstallDeps:     false,
		ApproveBuild:    false,
		ChangeName:      false,
		OnBeforeInstall: PrepareCmake(o.Name),
	})
}

// PrepareCmake exposes the cmake post-copy hook for reuse and testing.
func PrepareCmake(projectName string) func(ctx context.Context, projectPath string) error {
	return func(ctx context.Context, projectPath string) error {
		// Mirror the TS onBeforeInstall: a failed rename is logged by the step
		// and must not abort the run.
		step.ChangeCmakeProjectName(ctx, projectPath, projectName)
		return step.ConfigureCmakeProject(ctx, projectPath)
	}
}
