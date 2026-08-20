# Go Migration Review — TODO

Review against `go-mig.md` + original TS source. The code **compiles cleanly** with Go 1.27.0.
Embedded `uv-notebook` and `cmake-cpp` templates are byte-identical to the originals.
Prompt flow, pipeline order, dotfile restore, WXT hooks, and package-manager config all match.
The npm update checker was removed (native binary distribution). Open items below.

## Fixed

- [x] **WXT template repo names.** Decision: keep `wxt-{name}-template`
      (`wxt-svelte-template`, `wxt-vanilla-template`, `wxt-solid-template`) in `internal/registry/registry.go`.
      This overrides spec §4.3's `kunver-template-wxt-*` wording — update `go-mig.md` §4.3 to match so the two stay consistent.
- [x] **Background update-check stdio.** `spawn_windows.go` + `spawn_unix.go` now open `os.DevNull` and assign it to
      `cmd.Stdin/Stdout/Stderr`, matching spec §2.6 / original TS `stdio: "ignore"`.
- [x] **Dead extensibility constructors.** Removed unused `PrepareFunc`, `RepoStarter`, `RepoStarterWith`, `BuiltinStarter`
      and the now-unused `io/fs` import from `internal/registry/registry.go`. `Starters` uses hand-written `Run` funcs.
- [x] **Leftover binary.** Removed committed `bin/initer.exe`.
- [x] **Acceptable deviation: committed `bin/initer.exe`** was a leftover build artifact — removed; `.gitignore` should exclude `bin/`.
- [x] **Update checker removed entirely.** The Go binary is distributed as a native binary (not via npm/npx), so the npm-registry update check no longer applies. Deleted `internal/update/` (update.go, spawn_windows.go, spawn_unix.go), removed the `--background-update-check` flag + `updateMessage` flow from `cmd/initer/main.go`, and removed the now-unused `hasFlag` helper. This overrides spec §2.6 by user decision.

## Decide / Not auto-fixed

- [x] **Bin/module name `initer` confirmed by user.** Module `github.com/brkunver/initer`, binary `initer`. This is the user's deliberate choice (differs from spec §3.1's `kunver` suggestion), so no change needed.
- [ ] **Extra feature not in spec:** `fetchTarball` (`internal/template/template.go`) adds a
      `GITHUB_TOKEN`/`GH_TOKEN` GitHub-API path for private repos. Spec §4.4 only specifies codeload. Harmless, left in place.

## Acceptable deviations (per spec §8 / intentional)

- [ ] Prompt text loses chalk colors (survey doesn't color prompts) — rendering may differ, behavior identical.
- [ ] `configurePackageManager` writes package.json **without** trailing newline — intentionally differs from old TS
      output (spec §2.5 mandates no newline). Keep in mind for the §6 output-comparison checklist.
- [ ] Prompt text loses chalk colors (survey doesn't color prompts) — rendering may differ, behavior identical.
- [ ] `configurePackageManager` writes package.json **without** trailing newline — intentionally differs from old TS
      output (spec §2.5 mandates no newline). Keep in mind for the §6 output-comparison checklist.

## Verification checklist (spec §6, manual)

- [ ] Run CLI: name validation (too short, bad chars, existing folder), project-type + PM prompts, editor prompt shown only when an editor exists.
- [ ] Scaffold `wxt` × svelte/vanilla/solid with each customization combo (i18n / content UI / wxt-storage).
- [ ] Scaffold `uv-notebook` (files + `uv sync`, failure path cleans up).
- [ ] Scaffold `cmake-cpp` (files + CMake renamed + `cmake -S . -B build` runs).
- [ ] Exercise pnpm/npm/bun: manager script written correctly, `pnpm-workspace.yaml` handled, `bun pm trust` already-trusted path accepted.
- [ ] Dotfile restore (`_gitignore` → `.gitignore`, etc.).
- [ ] Edit a template repo URL in `internal/registry/registry.go`, rebuild, confirm new source used.
- [ ] Temporarily add a dummy plain-repo starter (one registry line); confirm it appears and scaffolds; then remove.

## Other

- Should add binary to path later
