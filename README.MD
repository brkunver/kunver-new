# Opiniated Project Starter

CLI tool for creating new projects with pre-configured settings.

## Usage

```bash
pnpx | npx | bunx @kunver/new
```

The CLI asks for a project name, starter type, package manager when needed, and whether the project should be opened in your editor.

## Current starters

- React + TypeScript + Tailwind
- Next.js + Prisma
- WXT
  - Svelte
  - Vanilla
  - Solid
- UV Notebook
- C++ + CMake

## Notes

- C++ + CMake projects include a `manager.ts` bridge for commands like `bun manager.ts dev` and `bun manager.ts build`.
- The C++ + CMake starter automatically updates the CMake project name to the folder name you enter.
- UV Notebook projects are copied from a template and install Python dependencies with `uv sync`.
- The UV Notebook template keeps Torch-related `pyproject.toml` entries commented out so users can opt in manually.

## Package managers

- Bun
- pnpm
- npm

Some starters intentionally skip package manager selection because they do not need JS dependencies.

## Output

Generated templates live under [src/public/templates](src/public/templates) in this repository.

## Status

This project is intentionally opinionated and focused on a small set of starters.
