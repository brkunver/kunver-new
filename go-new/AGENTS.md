# AGENTS.md — `initer`

Opinionated project-starter CLI. A Go rewrite of the TypeScript CLI `@kunver/new`
(formerly bin `kunver`). It scaffolds a new project by prompting for a name,
type, package manager, and (optionally) an editor, then generates the files.

- **Module path:** `github.com/brkunver/initer`
- **Binary name:** `initer`
- **Language:** Go 1.27 (no framework; stdlib + a few small libs)
- **Tests:** none (manual verification only — see bottom)
- **Distribution:** a single static native binary, built by the user. No CI/GitHub Actions.

## What it does

`initer` asks a few prompts and scaffolds one of three starters:

| Starter      | Source                                | Package-manager prompt | Notes |
| ------------ | ------------------------------------- | ---------------------- | ----- |
| `wxt`        | GitHub template repos (fetched live)  | yes (default `bun`)    | 3 frameworks: svelte, vanilla, solid |
| `uv-notebook`| embedded in the binary (`go:embed`)   | skipped                | runs `uv sync` after generation |
| `cmake-cpp`  | embedded in the binary (`go:embed`)   | skipped                | renames CMake project, runs `cmake -S . -B build` |

Removed starters (compared to the old TS CLI): `react-ts-tw`, `next-prisma`.

For `wxt`, after the main prompts it asks: framework, i18n (`@wxt-dev/i18n`),
content UI (svelte/solid only), and wxt-storage. These customize the downloaded
template (remove content UI dir, inject `default_locale`/`modules`, add storage
permission, etc.).

## Architecture

```
cmd/initer/main.go      entrypoint: flag parse, version banner, prompt flow, dispatch
internal/registry/      SINGLE extension point: all starters + template repo URLs live here
internal/starter/       per-starter flows (wxt, notebook, cmake); embedded template files under embed/
internal/pipeline/      shared scaffold pipeline (materialize → onBeforeInstall → pm/install/approve/name)
internal/template/      download+extract GitHub tarball, write embedded FS, restore dotfiles
internal/step/          configure-pm, install, approve-builds, change-name, cmake helpers
internal/editor/        open-in-editor
internal/xutil/         commandExists, cleanup, semver compare, JSON read/write helpers
```

### Adding or removing a starter (extensibility rule)

`internal/registry/registry.go` is the **only** place that maps a project type
to a starter and holds external repo URLs. To add a starter, add one entry to
`Starters` (and, for `wxt`-like repos, one line in `wxtTemplateRepos`). To
remove one, delete its entry. Prompt choices and dispatch are derived from that
slice, so nothing else needs touching. Never branch on `type == "x"` in shared
code — express differences through the starter's own `Run`/`Spec` config.

### Template repos (WXT)

The three WXT templates are fetched at scaffold time from GitHub codeload
(no `git` needed):

- `brkunver/wxt-svelte-template`
- `brkunver/wxt-vanilla-template`
- `brkunver/wxt-solid-template`

Ref is pinned to `main` in `registry.go`. Each repo must contain a `template/`
subfolder holding the actual project files. **These repos must be created and
populated** (move the old `src/public/templates/wxt-*/` contents into each
repo's `template/` dir) before `initer wxt` works.

Embedded starters (`uv-notebook`, `cmake-cpp`) keep their files under
`internal/starter/embed/` and are compiled into the binary, so they work
offline.

### Dotfile convention

Template files use an underscore prefix for dotfiles (e.g. `_gitignore`,
`_prettierrc.json`, `_python-version`, `_clang-format`). After copy, any entry
whose name starts with `_` and is longer than one char is renamed to
`.` + name (recursing into directories). Keep this convention in templates.

## Conventions

- Errors: pipeline prints `Error creating project: <err>`, cleans up the
  partially created folder (never one that pre-existed), then returns.
- Colors via `fatih/color`; spinners via `briandowns/spinner`; prompts via
  `survey/v2`.
- JSON written with 2-space indent; `configurePackageManager` output has **no**
  trailing newline, `changeProjectName` output has a trailing newline.
- Prefer the existing packages' structure; keep the registry as the single
  source of truth for starters and repo URLs.
- Version is set at build time (see below); do not read it from a file.

## Build

```sh
cd go-new
go build -o bin/initer ./cmd/initer
# with version injected:
go build -ldflags "-X main.version=1.2.3" -o bin/initer ./cmd/initer
```

## Notes / decisions

- The npm-registry **update checker was intentionally removed**: this is a
  native binary, not an npm/npx package, so the `@kunver/new` update prompt no
  longer applies.
- The binary name is `initer` (deliberate choice, not `kunver`).
- `fetchTarball` also supports a `GITHUB_TOKEN`/`GH_TOKEN` path for private
  template repos (GitHub API tarball); falls back to public codeload otherwise.

## Manual verification (no automated tests)

1. Run `initer`: name validation (too short, bad chars, existing folder),
   project-type + package-manager prompts, editor prompt shown only when an
   editor binary exists.
2. Scaffold each starter and compare to expected output:
   - `wxt` × svelte/vanilla/solid with i18n / content-UI / wxt-storage combos.
   - `uv-notebook` (files + `uv sync`; failure path cleans up).
   - `cmake-cpp` (files + CMake project renamed + `cmake -S . -B build`).
3. Exercise pnpm/npm/bun: manager script, `pnpm-workspace.yaml` handling,
   `bun pm trust` already-trusted path.
4. Confirm dotfile restore (`_gitignore` → `.gitignore`, etc.).
5. Spot-check the registry: change a template repo URL, rebuild, confirm the
   new source is used.
