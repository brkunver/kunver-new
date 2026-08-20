package template

import (
	"archive/tar"
	"compress/gzip"
	"context"
	"fmt"
	"io"
	"io/fs"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// Repo identifies a template repository on GitHub.
type Repo struct {
	Owner string
	Repo  string
	Ref   string
}

var downloadClient = &http.Client{Timeout: 60 * time.Second}

// DownloadRepo downloads the repo tarball, extracts it and copies the contents
// of the template/ subfolder into dst.
func DownloadRepo(ctx context.Context, repo Repo, dst string) error {
	body, err := fetchTarball(ctx, repo)
	if err != nil {
		return err
	}
	defer body.Close()

	tmp, err := os.MkdirTemp("", "kunver-template-*")
	if err != nil {
		return err
	}
	defer os.RemoveAll(tmp)

	if err := ExtractTarGz(body, tmp); err != nil {
		return err
	}

	root, err := findTemplateRoot(tmp)
	if err != nil {
		return err
	}
	return CopyDir(root, dst)
}

func fetchTarball(ctx context.Context, repo Repo) (io.ReadCloser, error) {
	token := os.Getenv("GITHUB_TOKEN")
	if token == "" {
		token = os.Getenv("GH_TOKEN")
	}

	if token != "" {
		url := fmt.Sprintf("https://api.github.com/repos/%s/%s/tarball/%s", repo.Owner, repo.Repo, repo.Ref)
		req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
		if err != nil {
			return nil, err
		}
		req.Header.Set("Authorization", "Bearer "+token)
		req.Header.Set("User-Agent", "kunver-new-cli")
		resp, err := downloadClient.Do(req)
		if err != nil {
			return nil, err
		}
		if resp.StatusCode != http.StatusOK {
			resp.Body.Close()
			return nil, fmt.Errorf("GitHub returned %s", resp.Status)
		}
		return resp.Body, nil
	}

	url := fmt.Sprintf("https://codeload.github.com/%s/%s/tar.gz/refs/heads/%s", repo.Owner, repo.Repo, repo.Ref)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "kunver-new-cli")
	resp, err := downloadClient.Do(req)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode == http.StatusNotFound || resp.StatusCode == http.StatusForbidden {
		resp.Body.Close()
		return nil, fmt.Errorf(
			"%s. If the template repository is private, set the GITHUB_TOKEN environment variable",
			resp.Status,
		)
	}
	if resp.StatusCode != http.StatusOK {
		resp.Body.Close()
		return nil, fmt.Errorf("GitHub returned %s", resp.Status)
	}
	return resp.Body, nil
}

// findTemplateRoot returns the template/ subfolder of an extracted tarball,
// falling back to the tarball root directory.
func findTemplateRoot(tmp string) (string, error) {
	entries, err := os.ReadDir(tmp)
	if err != nil {
		return "", err
	}
	for _, e := range entries {
		if !e.IsDir() {
			continue
		}
		root := filepath.Join(tmp, e.Name())
		templateDir := filepath.Join(root, "template")
		if _, err := os.Stat(templateDir); err == nil {
			return templateDir, nil
		}
		return root, nil
	}
	return "", fmt.Errorf("no template directory found in archive")
}

// CopyDir recursively copies src into dst, preserving file modes and symlinks.
func CopyDir(src, dst string) error {
	return filepath.WalkDir(src, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		rel, err := filepath.Rel(src, path)
		if err != nil {
			return err
		}
		if rel == "." {
			return os.MkdirAll(dst, 0o755)
		}
		target := filepath.Join(dst, rel)
		if d.IsDir() {
			return os.MkdirAll(target, 0o755)
		}
		if d.Type()&fs.ModeSymlink != 0 {
			link, err := os.Readlink(path)
			if err != nil {
				return err
			}
			return os.Symlink(link, target)
		}
		return copyFile(path, target)
	})
}

func copyFile(src, dst string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()
	info, err := in.Stat()
	if err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(dst), 0o755); err != nil {
		return err
	}
	out, err := os.OpenFile(dst, os.O_CREATE|os.O_TRUNC|os.O_WRONLY, info.Mode())
	if err != nil {
		return err
	}
	defer out.Close()
	_, err = io.Copy(out, in)
	return err
}

// WriteFS writes the files of an embedded filesystem into dst.
func WriteFS(fsys fs.FS, dst string) error {
	return fs.WalkDir(fsys, ".", func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if path == "." {
			return os.MkdirAll(dst, 0o755)
		}
		target := filepath.Join(dst, filepath.FromSlash(path))
		if d.IsDir() {
			return os.MkdirAll(target, 0o755)
		}
		if d.Type()&fs.ModeSymlink != 0 {
			link, err := fs.ReadLink(fsys, path)
			if err != nil {
				return err
			}
			return os.Symlink(link, target)
		}
		data, err := fs.ReadFile(fsys, path)
		if err != nil {
			return err
		}
		return os.WriteFile(target, data, 0o644)
	})
}

// RestoreDotfiles renames underscore-prefixed entries to dotfiles
// (e.g. _gitignore -> .gitignore), recursing into renamed directories.
func RestoreDotfiles(dir string) error {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return err
	}
	for _, entry := range entries {
		current := filepath.Join(dir, entry.Name())
		resolved := current
		if strings.HasPrefix(entry.Name(), "_") && len(entry.Name()) > 1 {
			resolved = filepath.Join(dir, "."+entry.Name()[1:])
			if err := os.Rename(current, resolved); err != nil {
				return err
			}
		}
		if entry.IsDir() {
			if err := RestoreDotfiles(resolved); err != nil {
				return err
			}
		}
	}
	return nil
}

// ExtractTarGz extracts a gzipped tar stream into dst, guarding against path
// traversal outside dst.
func ExtractTarGz(r io.Reader, dst string) error {
	gz, err := gzip.NewReader(r)
	if err != nil {
		return err
	}
	defer gz.Close()

	tr := tar.NewReader(gz)
	for {
		hdr, err := tr.Next()
		if err == io.EOF {
			return nil
		}
		if err != nil {
			return err
		}
		name := filepath.Join(dst, filepath.FromSlash(hdr.Name))
		cleanDst := filepath.Clean(dst)
		if name != cleanDst && !strings.HasPrefix(name, cleanDst+string(os.PathSeparator)) {
			return fmt.Errorf("invalid path in archive: %s", hdr.Name)
		}
		switch hdr.Typeflag {
		case tar.TypeDir:
			if err := os.MkdirAll(name, 0o755); err != nil {
				return err
			}
		case tar.TypeReg:
			if err := os.MkdirAll(filepath.Dir(name), 0o755); err != nil {
				return err
			}
			out, err := os.OpenFile(name, os.O_CREATE|os.O_TRUNC|os.O_WRONLY, os.FileMode(hdr.Mode)&0o777)
			if err != nil {
				return err
			}
			if _, err := io.Copy(out, tr); err != nil {
				out.Close()
				return err
			}
			out.Close()
		}
	}
}
