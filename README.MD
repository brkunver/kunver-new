# Opiniated Project Starter

CLI tool for creating new projects with pre-configured settings.

## Usage

```bash
pnpm dlx @kunver/new
# or
npx @kunver/new
# or
bunx @kunver/new
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

- C++ + CMake projects include a `manager.cjs` bridge for commands like `node manager.cjs dev` and `node manager.cjs build`.
- The C++ + CMake starter automatically updates the CMake project name to the folder name you enter.
- UV Notebook projects are copied from a template and install Python dependencies with `uv sync`.
- The UV Notebook template keeps Torch-related `pyproject.toml` entries commented out so users can opt in manually.

## Package managers

- pnpm
- npm
- Bun

Some starters intentionally skip package manager selection because they do not need JS dependencies.

## Output

Generated templates live under [src/public/templates](src/public/templates) in this repository.

## Status

This project is intentionally opinionated and focused on a small set of starters.
