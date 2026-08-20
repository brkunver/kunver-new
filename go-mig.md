# Go Migration Plan for the Kunver CLI

## 1. Context & Goals

- The CLI is currently a TypeScript project (`@kunver/new`, bin `kunver`) built with tsup, run with Bun/Node.
- Two goals for this migration:
  1. Rewrite the CLI in Go so it compiles to a single native binary.
  2. Stop shipping boilerplate folders inside the main CLI repo. The WXT templates move to their own GitHub repos; the small starters (uv-notebook, cmake-cpp) are embedded in the binary and generated programmatically.
- The Go CLI **must do the same task** as the TS CLI (same prompts, validations, defaults, and scaffolded output), but it is **not** a line-by-line port. Write idiomatic Go with its own structure. The behavior spec in §2 is a functional reference, not a pixel-parity or file-layout contract.
- Starter scope is reduced: `react-ts-tw` and `next-prisma` are **removed**. The remaining starters are `wxt` (3 frameworks), `uv-notebook`, and `cmake-cpp`.
- No automated tests in the Go version. Release/distribution is handled outside this repo (user builds and ships a single binary).
- The Go CLI must be **extensible**: adding a starter (a plain template repo, a repo with post-copy steps, or a built-in) should be a small, localized change, and removing one should never touch other starters or the shared pipeline. See §4.7.

## 2. Current Behavior Contract (what must not change)

This section is the functional spec the Go CLI must satisfy. Treat the messages, defaults, validation rules, and step order as the source of truth for **what the CLI does**, but implement them idiomatically in Go. Output text that users see (messages, errors, banners) should stay recognizable; internal structure and prompt rendering can differ.

### 2.1 Prompt flow (src/index.ts)

1. If `--background-update-check` is passed as an argv flag, run the background update check and exit 0. (This flag is used by the CLI re-invoking itself.)
2. Read the CLI's own version (from `package.json` today; from build-time ldflags in Go).
3. Call `checkForUpdates(version)` (see §2.6) and hold the result.
4. Print `Kunver v<bold version>` followed by a blank line (chalk green).
5. Prompt project name (input):
   - Message: `Enter a project name` (bold blue).
   - Default: `my-project` (gray).
   - Validation (must fail with the exact messages):
     - empty or < 2 chars → "Project name must be at least 2 characters"
     - does not match `^[a-z0-9]+(-[a-z0-9]+)*$` → "Only lowercase letters, numbers, and single hyphens allowed. No spaces or special characters."
     - folder `<cwd>/<name>` already exists → "A folder with that name already exists"
6. Select project type (select):
   - Message: `Select a project type` (bold yellow).
   - Choices (values): `wxt`, `uv-notebook`, `cmake-cpp`.
   - Default: `wxt` (decision point, see §9).
7. Select package manager (select) — skipped for `uv-notebook` and `cmake-cpp`:
   - Message: `Select a package manager` (bold green).
   - Choices: `pnpm`, `npm`, `bun`. Default: `bun`.
8. Open in editor (select, optional):
   - Choices: `antigravity`, `devin-desktop`, `subl`, `no`, `cursor`, `code`, filtered to those whose binary exists via `commandExists` (so `no` is always present).
   - Message: `Open in editor?` (bold cyan). Default: `no`.
   - The prompt is **only shown when more than one choice remains** (i.e. at least one real editor is installed).
9. Run `projectStarter(options)`.
10. If an update message was produced in step 3, print it after scaffolding completes.

### 2.2 Project types → pipeline (src/project-starter.ts)

`createTemplateProject` is the shared pipeline. Steps run in this exact order (each step returning `false` or throwing aborts the whole run):

1. `copyTemplateFolder` (copy + restore underscore-prefixed dotfiles)
2. `onBeforeInstall(projectPath)` if provided
3. `configurePackageManager(pm, projectPath)` if `addManager` (default true)
4. `installDependencies(pm, name, cwd)` if `installDependency` (default true)
5. `approveBuilds(pm, name, cwd)` if `approveBuild` (default true)
6. `changeProjectName(projectPath, name)` if `changeName` (default true)

On any failure: print `Error creating project:` + error, then `cleanupProjectFolder` (never touches a folder that already existed before the run), then rethrow.

Starter wiring:

| Project type  | Config                                                                                                                                                                                                                          |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wxt`         | custom `createWxtProject` (§2.4.1)                                                                                                                                                                                              |
| `uv-notebook` | custom `createPythonNotebookProject` (§2.4.2), no package manager prompt                                                                                                                                                        |
| `cmake-cpp`   | programmatic cmake generation (no copy step), `packageManager="bun"`, `addManager=false`, `approveBuild=false`, `installDependency=false`, `changeName=false`, `onBeforeInstall` = rename CMake project + `cmake -S . -B build` |

After the starter, if `openInEditor !== "no"`, run `openInEditor(name, cwd, editor)`.

If an unknown project type is passed: print `Project Type Not Implemented <type>` (red) and return.

The project-type prompt choices and the dispatch table are **derived from the starter registry** (§4.6/§4.7), never hardcoded elsewhere — that is what makes adding/removing a starter a one-place change.

### 2.3 Template copy + dotfile restore (src/helpers/copy-template.ts)

- Recursively copy template dir → destination dir.
- After copy, walk all entries recursively: any file/dir whose name starts with `_` and is longer than 1 char is renamed to `.` + name[1:] (e.g. `_gitignore` → `.gitignore`, `_prettierrc.json` → `.prettierrc.json`, `_clang-format` → `.clang-format`). Recurse into renamed directories too.
- Spinner text: `Copying template folder...` → succeed `Copied template folder` / fail `Failed to copy template folder`. Returns bool.

### 2.4 Starter-specific behavior

#### 2.4.1 WXT (src/starters/create-wxt.ts)

Sub-prompts after the main flow, for type `wxt`:

1. Select framework (select): message `Select a framework for WXT` (bold magenta), choices `svelte`, `vanilla`, `solid` (displayed with first letter capitalized), default `svelte`. Maps to templates `wxt-svelte`, `wxt-vanilla`, `wxt-solid`.
2. Confirm i18n: `Use i18n? (@wxt-dev/i18n)` default `false`.
3. Confirm content UI — only asked for `svelte`/`solid`: `Do you want to use content UI?` default `false`.
4. Confirm wxt-storage: `Do you want to use wxt-storage?` default `false`.

Then `createTemplateProject` with template for the framework + `onBeforeInstall`:

- If (svelte or solid) and content UI disabled: delete `entrypoints/content/` dir, write `entrypoints/content.ts` with the exact default content script (matches `*://*.google.com/*`, logs "Hello content.").
- If i18n: add `@wxt-dev/i18n: ^0.2.7` to `devDependencies`; edit `wxt.config.ts` — inject `default_locale: "en"` into `manifest: {`, and register the module (`modules: ["@wxt-dev/i18n/module", ...` or insert the `modules` key after `export default defineConfig({`); create `locales/en.yml` with `hello: Hello!\n`.
- If wxt-storage: add `permissions: ["storage"]` to the manifest block in `wxt.config.ts` (regex on the `manifest: { ... }` block; throw "Could not add storage permission to wxt.config.ts" if the pattern can't be applied); create `utils/storage.ts` with the example comment block.

#### 2.4.2 UV Notebook (src/starters/create-python-notebook.ts)

- Generate the `uv-notebook` files programmatically from the embedded template (§4.2).
- Run `uv sync` in the project dir with stdout/stderr inherited.
- On `uv sync` failure: print red `Failed to sync uv dependencies.`, yellow `Please ensure 'uv' is installed: https://docs.astral.sh/uv/getting-started/installation/`, clean up the folder (unless it pre-existed), rethrow.
- On generation failure: clean up and throw `Failed to copy uv notebook template`.

#### 2.4.3 CMake C++

- Generate the `cmake-cpp` files programmatically from the embedded template (§4.2), then `onBeforeInstall`:
  - `changeCmakeProjectName`: regex-replace the CMake `project(...)` call in `CMakeLists.txt` with `project("<name>"...)`, preserving the remaining args. Prints `Error updating CMake project name:` on failure, returns bool.
  - `configureCmakeProject`: print `Configuring CMake project in <blue path>`; run `cmake -S . -B build` inherited; on success print `CMake project configured successfully`; on failure print yellow `Automatic CMake configure skipped. Run `cmake -S . -B build` manually if needed.` and return false (does NOT abort the run).

### 2.5 Utility behaviors

- `configurePackageManager(pm, projectPath)` (src/helpers/add-manager-script.ts):
  - Set `scripts.manager`: `bun manager.cjs bun` for bun, else `node manager.cjs <pm>`.
  - If `scripts.resize` exists: `bunx @kunver/resize` (bun), `npx @kunver/resize` (npm), `pnpm dlx @kunver/resize` (pnpm).
  - If `scripts["zip:all"]` exists: `bun --parallel zip zip:firefox` (bun), else `wxt zip && wxt zip -b firefox`.
  - If pm ≠ bun, delete `trustedDependencies`.
  - If pm = bun, read `pnpm-workspace.yaml`, extract entries matching `^\s{2}(.+?):\s*true\s*$`, strip surrounding quotes, set as `trustedDependencies` (only if non-empty). Missing workspace file is silently ignored.
  - Write package.json with 2-space JSON, **no trailing newline**.
  - If pm ≠ pnpm, delete `pnpm-workspace.yaml`.
- `installDependencies`: print `Installing dependencies with <cyan pm>\n`, run `<pm> install` in project dir (inherited stdio), return bool.
- `approveBuilds`:
  - pnpm: `pnpm approve-builds --all` in project dir. Spinner `Approving builds for <blue name>` → succeed/fail variants. Returns bool.
  - bun: `bun pm trust --all` with `reject: false`. Exit 0, or exit 1 with stderr matching `/already trusted|0 scripts ran/i` → success. Anything else → fail. Same spinner messages.
  - npm: no-op, returns true.
- `changeProjectName`: set package.json `name` = lowercase(name) with whitespace runs replaced by `-`. Write 2-space JSON + trailing newline. Returns bool.
- `commandExists`: scan PATH dirs (split on `;` on Windows, `:` elsewhere), on Windows also try PATHEXT extensions (default `.EXE;.CMD;.BAT;.COM`), check file existence/executable. Used to filter editor choices.
- `openInEditor`: print `Opening <blue name> in <green editor>`, run `<editor> <projectName>` in cwd, return bool.

### 2.6 Update checker (src/helpers/update-checker.ts)

- Cache file: `~/.kunver-update-cache.json` with `{ latestVersion, lastChecked }`.
- `checkForUpdates(version)`:
  - If no cache or cache older than 24h, re-invoke the running binary with `--background-update-check` (detached, stdio ignored) and unref it.
  - If cache exists and its `latestVersion` > `version` (semver x.y.z comparison, 3 numeric parts), return the exact update banner text (yellow, box-drawing chars): "A new version of @kunver/new is available: <green latest>" / "Current version: <gray current>" / "Run `npm i -g @kunver/new` or use `bunx @kunver/new`".
- `runBackgroundCheck`: `GET https://registry.npmjs.org/@kunver/new/latest` with header `User-Agent: kunver-new-cli`, 5s timeout; on success write `{ latestVersion, lastChecked: Date.now() }` to the cache file. All network/write errors are swallowed.

## 3. Target Architecture

### 3.1 Repo layout (new Go repo)

New repository (suggested `github.com/brkunver/kunver`, or keep `kunver-new`). Template folders are removed from the CLI repo entirely. Suggested (not mandatory) layout:

```
.
├── cmd/kunver/main.go          # entrypoint: flag parse, version banner, prompt flow
├── internal/
│   ├── registry/               # starter registry — ALL starters + template repo links live here (see §4.6–4.7)
│   ├── starter/                # custom starter flows (wxt, notebook, cmake); one file per starter
│   ├── template/               # fetch + extract template repo, copy + dotfile restore
│   ├── step/                   # configure-pm, install, approve, change-name, cmake-config
│   ├── editor/                 # open in editor
│   ├── update/                 # update checker + background check
│   └── xutil/                  # commandExists, cleanupProjectFolder, semver compare
└── go.mod
```

The `registry` package is the single, obvious place for all external repo URLs so they are trivial to find and update (§4.6).

### 3.2 Library choices

| Concern         | TS today          | Go choice                                | Notes                                                                                                                                                                                |
| --------------- | ----------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Prompts         | @inquirer/prompts | `github.com/AlecAivazis/survey/v2`       | Closest behavioral match (sequential single prompts, defaults, validators, select/confirm). Rendering/keybindings differ slightly; validation logic and defaults are ported exactly. |
| Colors          | chalk             | `github.com/fatih/color`                 | Exact ANSI color mapping is trivial to port.                                                                                                                                         |
| Spinners        | ora               | `github.com/briandowns/spinner`          | Same start/succeed/fail lifecycle.                                                                                                                                                   |
| Subprocesses    | execa             | `os/exec` (stdlib)                       | `cmd.Dir`, inherited stdio, exit-code + stderr handling.                                                                                                                             |
| HTTP            | fetch             | `net/http` (stdlib)                      | 5s timeout for update check, tarball download.                                                                                                                                       |
| Tarball extract | n/a               | `archive/tar` + `compress/gzip` (stdlib) | No external tool needed to fetch templates.                                                                                                                                          |
| Testing         | vitest            | none                                     | No automated tests in the Go version; manual verification only (§6).                                                                                                                 |

No framework is required; the project is small. Prefer stdlib + the four small libs above. The package layout in §3.1 is a suggestion — structure the code the way it reads best in Go (e.g. start with a single `main.go` and split packages only when they earn their keep). What matters is that the tasks in §2 are performed, not how the code is organized relative to the TS repo.

## 4. Template Outsourcing Design

### 4.1 Principle

Each starter is described in a **registry entry** that declares one of two sources:

- **Template repo**: an external GitHub repo whose files are fetched at scaffold time (the 3 WXT starters).
- **Built-in (programmatic)**: files are generated by Go code compiled into the binary (uv-notebook, cmake-cpp).

This is the answer to "not every repo needs boilerplate": the WXT templates get their own repos (rich entrypoints, assets, binary icons), while the tiny file-oriented starters are embedded and generated in code.

### 4.2 Starter → source matrix (recommended)

| Starter                      | Source                    | Reason                                                                                                                                 |
| ---------------------------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `wxt` (svelte/vanilla/solid) | template repos (3)        | Rich entrypoints/assets/options/popups; binaries/icons are awkward to embed                                                            |
| `uv-notebook`                | **built-in programmatic** | 5 small text files (pyproject.toml, main.ipynb, .python-version, .gitignore, README) — embed as `//go:embed`                           |
| `cmake-cpp`                  | **built-in programmatic** | 9 small text files (CMakeLists.txt, src/, include/, manager.cjs, .clang-format, .gitignore, README, agents.md) — embed as `//go:embed` |

> Removed: `react-ts-tw` and `next-prisma` are no longer offered as starters.

### 4.3 Template repos

One repo per template (keeps each independently versionable and small):

- `brkunver/kunver-template-wxt-svelte`
- `brkunver/kunver-template-wxt-vanilla`
- `brkunver/kunver-template-wxt-solid`

Repo structure: template files live in a `template/` subfolder at the repo root, so the repo itself can hold its own README/LICENSE outside the copied tree. Files keep the underscore-prefix convention (`_gitignore`, `_prettierrc.json`) so GitHub tracks them and the copy step restores them exactly as today.

Migration mechanics: `git mv` the folder from `src/public/templates/<name>` into the new repo's `template/` dir; the folder must be **deleted** from the CLI repo. The `src/public` and `dist/templates` logic and tsup `publicDir` config are removed.

### 4.4 Fetch mechanism (no git dependency)

At scaffold time the CLI downloads a tarball from GitHub codeload and extracts it with the stdlib:

```
https://codeload.github.com/brkunver/kunver-template-wxt-svelte/tar.gz/refs/heads/main
```

Extraction yields `<repo>-<ref>/...`; the CLI strips the top-level folder and uses the contents of `template/`. Pure Go (`archive/tar` + `compress/gzip`), works without `git` installed, supports shallow fetching of the latest template state.

Optional enhancement (post v1): cache extracted templates under `~/.kunver/templates/<name>@<ref>/` keyed by ref to avoid re-downloading and enable offline reuse. Not required for parity.

### 4.5 Versioning

- Registry pins a ref per template. Start with `refs/heads/main`.
- Later, templates can be tagged and the registry can pin exact tags for reproducibility; the fetch code already supports arbitrary refs in the URL.

### 4.6 Registry — the single, easy-to-find place for template links

All external template repo URLs must be discoverable and editable in **one obvious location**, because they can change (repo renamed/moved, ref updated). The `registry` package is that place.

Design:

- One file, `internal/registry/registry.go`, holds a small table where every template repo link is spelled out next to its starter, with a comment telling the reader to update it if the repo changes. Example:

  ```go
  // Template repos. If a repo is renamed/moved or a ref needs pinning, edit here.
  var wxtTemplates = []TemplateRepo{
      {Framework: "svelte", Owner: "brkunver", Repo: "kunver-template-wxt-svelte", Ref: "main"},
      {Framework: "vanilla", Owner: "brkunver", Repo: "kunver-template-wxt-vanilla", Ref: "main"},
      {Framework: "solid",   Owner: "brkunver", Repo: "kunver-template-wxt-solid",   Ref: "main"},
  }
  ```

- The codeload URL is derived from `Owner/Repo/Ref` at runtime, so there is only one place to edit.
- The registry also records which types skip the package-manager prompt (`uv-notebook`, `cmake-cpp`) and which starters are built-in (`embed.FS`) vs. template-repo based.
- Optional resilience: allow overriding a link via environment variables (e.g. `KUNVER_TEMPLATE_WXT_SVELTE_REPO`) so a template can be swapped without recompiling. Not required for v1 — a single source file is already easy to edit.
- Do **not** scatter URLs across multiple files; keep them all in this registry file so a change is a one-line edit.

### 4.7 Extensibility — adding & removing a starter

The registry is the **single extension point**. The prompt choices and dispatch are generated from it (§2.2), and the shared pipeline is generic and config-driven, so a starter is purely data + an optional self-contained handler.

Conceptual model:

```go
// internal/registry/registry.go — the only file that lists every starter.
type Starter struct {
    Type   string                       // value shown in the project-type prompt
    Run    func(ctx context.Context, o Options) error // full flow for this type
}
```

Convenience constructors cover the common cases, so most additions never write a handler:

```go
// 1. Plain copy: just a GitHub repo to clone. One line in the registry.
func repoStarter(r TemplateRepo) Starter

// 2. Repo + post-copy steps: one line in the registry + a Prepare func.
func repoStarterWith(r TemplateRepo, prepare PrepareFunc) Starter

// 3. Built-in files: a go:embed folder + one line in the registry.
func builtinStarter(fs embed.FS) Starter
```

Adding a starter is one of:

- **Plain repo template** — create the repo, then add one line: `"my-app": repoStarter({Owner, Repo, Ref})`. Nothing else to change.
- **Repo + post-copy steps** — add the one registry line with a `Prepare func(ctx, projectPath) error` and put that function in its own file (`starter/myapp.go`), fully self-contained.
- **Built-in** — drop files in a folder and register with `builtinStarter`; small templates can be embedded without a repo.
- **Fully custom flow** (like `wxt`) — one registry line `"my-app": {Run: runMyApp}` plus `starter/myapp.go`; the handler composes prompts and calls the shared `createProject` helper.

Removing a starter is: delete its registry line, and if it had custom logic, delete its one file. Nothing else references it, because:

- Prompt choices come from the registry (iterate `Starters`).
- Dispatch is a map lookup by `Type`.
- The shared pipeline has no per-starter branching — every difference is expressed through the starter's own config/handler.
- Starters never share mutable state; `Prepare` and handlers are isolated per starter.

Rules to keep this property:

- The registry file is the only place that maps `Type → starter` and holds repo URLs.
- Per-starter logic lives in `starter/<name>.go` and only touches its own project path.
- Never add `if type == "x"` branches in shared code; extend the `Starter` struct instead (e.g. a new config flag), with a default so existing starters are unaffected.

## 5. Distribution

- The CLI is built as a **single static Go binary** per platform. Version is injected at build time via `-ldflags "-X main.version=<semver>"` (the Go version reads its own version from this, replacing today's `package.json` read).
- Building and shipping the binary is **handled by the user outside this repo** — no CI/GitHub Actions in the project. No publish pipeline, no release automation to build here.
- Keep the door open for a thin `@kunver/new` npm wrapper later if `bunx/npx` continuity is ever wanted, but it is out of scope for this migration.

## 6. Verification (manual — no automated tests)

Per project decision, the Go version ships **without automated tests**. Instead, verify each starter by hand before release using the §2 spec as the checklist:

1. Run the CLI and confirm the prompt flow (§2.1): name validation (too short, bad characters, existing folder), project-type and package-manager prompts, editor prompt (shown only when an editor binary exists).
2. Scaffold each starter and compare the resulting file tree against the current TS output:
   - `wxt` × `svelte`/`vanilla`/`solid` with each customization combination (i18n on/off, content UI on/off, wxt-storage on/off).
   - `uv-notebook` (files + `uv sync` runs, failure path cleans up).
   - `cmake-cpp` (files + CMake project renamed + `cmake -S . -B build` runs).
3. Exercise each package manager (`pnpm`, `npm`, `bun`): manager script written correctly, `pnpm-workspace.yaml` handled, `bun pm trust` already-trusted path accepted.
4. Confirm dotfile restore (`_gitignore` → `.gitignore`, etc.) and the update-checker banner/background behavior.
5. Spot-check the edit-in-the-registry workflow: change a template repo URL in `internal/registry/registry.go`, rebuild, and confirm the new source is used.
6. Spot-check extensibility (§4.7): temporarily add a dummy plain-repo starter (one registry line) and confirm it appears in the prompt and scaffolds correctly; then remove it and confirm no other starter or the build is affected.

The TS repo can be kept locally as a reference during development, then deleted.

## 7. Migration Steps (phased)

**Phase 0 — reference snapshot**

1. Capture the current scaffolded output of each starter (WXT × frameworks/customizations, uv-notebook, cmake-cpp) as a manual reference for §6. Keep the TS repo locally during development as an oracle, then delete.

**Phase 1 — extract templates** 2. Create the 3 WXT template repos; `git mv` each template folder into `template/`; publish repos. 3. Delete `src/public/templates/*` from the CLI repo; remove `publicDir` from tsup config; delete `src/starters`, template helpers.

**Phase 2 — Go CLI skeleton** 4. Create Go repo. Port: constants + registry (§4.6), prompt flow (§2.1), `commandExists`, version banner. 5. Port shared pipeline: create project, copy+dotfile restore, configure-pm, install, approve, change-name, cleanup (§2.2–2.3, §2.5) — in idiomatic Go, not a file-for-file mirror.

**Phase 3 — starters** 6. Port WXT flow (§2.4.1) — prompts, content-UI removal, i18n, wxt-storage. 7. Implement programmatic uv-notebook and cmake-cpp via `go:embed` (§4.2); port notebook + cmake hooks (§2.4.2–2.4.3). 8. Implement template fetch + extraction (§4.4) and wire the registry (§4.6) for the 3 WXT template-repo starters.

**Phase 4 — update checker & versioning** 9. Port update checker + background re-exec (§2.6). 10. Add ldflags version injection and the `go build` release command.

**Phase 5 — verify & ship** 11. Run the manual verification checklist (§6); fix discrepancies. 12. Build the single binary; hand it off for user-managed distribution. Deprecate the TS repo.

## 8. Risks & Tradeoffs

- **Network requirement**: template-repo starters now download at scaffold time; the old CLI worked offline (bundled templates). Programmatic starters (uv-notebook, cmake-cpp) still work offline. Mitigation: template caching (§4.4 optional).
- **Template link drift**: template repos can be renamed/moved, which would break scaffolding in released binaries. Mitigation: all links live in one registry file (§4.6) so a fix is a one-line edit + rebuild; optional env-var override avoids even a rebuild.
- **Prompt UX**: survey/v2 renders differently from @inquirer; the tasks/validations are identical but pixels differ. Acceptable since the goal is same task, not same rendering.
- **No automated tests**: regressions are caught by manual verification (§6). Acceptable per project decision.
- **Self re-exec for update check**: relies on the binary path (`os.Args[0]`); same caveat as the TS version re-spawning its module file.
- **Windows**: ensure tarball extraction and rename handle backslashes correctly; `commandExists` must keep the PATHEXT logic.

## 9. Open Decisions (confirm with user)

1. Template repos: OK with `brkunver/kunver-template-<name>` naming + `template/` subfolder? Any preference for tags vs `main` ref?
2. Default project type for the select prompt (currently `wxt`; previously `react-ts-tw`).
3. Go repo name: new `kunver` repo vs. reusing `kunver-new`.

> Decided (per user): `react-ts-tw` and `next-prisma` are removed. `uv-notebook` and `cmake-cpp` are embedded in the binary as programmatic starters. Only the 3 WXT templates move to their own repos. No automated tests in the Go version. No CI/GitHub Actions — the user builds and ships a single binary. Architecture is idiomatic Go, not a 1:1 TS mirror — same task, not same structure. Starters must be easy to add and remove without touching other code (§4.7).
