package xutil

import (
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"

	"github.com/fatih/color"
)

func Exists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}

// CommandExists reports whether command resolves to an executable on PATH,
// honoring PATHEXT extensions on Windows.
func CommandExists(command string) bool {
	var pathDirs []string
	if runtime.GOOS == "windows" {
		pathDirs = strings.Split(os.Getenv("PATH"), ";")
	} else {
		pathDirs = strings.Split(os.Getenv("PATH"), ":")
	}

	extensions := []string{""}
	if runtime.GOOS == "windows" {
		pathExt := os.Getenv("PATHEXT")
		if pathExt == "" {
			pathExt = ".EXE;.CMD;.BAT;.COM"
		}
		for _, ext := range strings.Split(pathExt, ";") {
			extensions = append(extensions, strings.ToLower(ext))
		}
	}

	for _, dir := range pathDirs {
		if dir == "" {
			continue
		}
		for _, ext := range extensions {
			full := filepath.Join(dir, command+ext)
			info, err := os.Stat(full)
			if err != nil || info.IsDir() {
				continue
			}
			if runtime.GOOS != "windows" && info.Mode()&0o111 == 0 {
				continue
			}
			return true
		}
	}
	return false
}

// CleanupProjectFolder removes a partially created project folder unless it
// already existed before the run.
func CleanupProjectFolder(projectPath, projectName string, existedBefore bool) {
	if existedBefore {
		return
	}
	if err := os.RemoveAll(projectPath); err == nil {
		fmt.Println(color.YellowString(`Removed partially created project folder "%s"`, projectName))
	}
}

// IsNewerVersion reports whether latest is a greater semver than current,
// comparing the first three numeric parts.
func IsNewerVersion(current, latest string) bool {
	currentParts := parseSemver(current)
	latestParts := parseSemver(latest)
	for i := 0; i < 3; i++ {
		c, l := 0, 0
		if i < len(currentParts) {
			c = currentParts[i]
		}
		if i < len(latestParts) {
			l = latestParts[i]
		}
		if l > c {
			return true
		}
		if c > l {
			return false
		}
	}
	return false
}

func parseSemver(version string) []int {
	version = strings.TrimPrefix(version, "v")
	parts := strings.Split(version, ".")
	out := make([]int, 0, 3)
	for _, p := range parts {
		n, err := strconv.Atoi(p)
		if err != nil {
			n = 0
		}
		out = append(out, n)
	}
	return out
}
