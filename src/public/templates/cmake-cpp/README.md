# Cpp + CMake template

Opinionated C++ project starter with CMake build system.

## Requirements

- CMake 3.20+
- Bun
- GCC, Clang, or MSVC
- VS Code C/C++ or CMake Tools extension

## CLI behavior

- `kunver-new` runs `cmake -S . -B build` automatically after creating the project when CMake is available.
- If that step fails, the project is still created and you can run the command manually.

## Manager bridge

- `bun manager.ts dev` configures, builds, and runs the app.
- `bun manager.ts build` configures if needed, then builds.
- `bun manager.ts run` runs the latest built executable.
- `bun manager.ts rebuild` deletes `build/`, then configures and builds again.
- `bun manager.ts clean` deletes `build/`.
- `bun manager.ts doctor` checks required files.

## Raw CMake usage

- Configure: `cmake -S . -B build`
- Build: `cmake --build build`
- Run: use the executable generated inside `build/` by your chosen CMake generator.

Note: `kunver` rewrites the CMake project name to the folder name you enter during creation, and `manager.ts` reads that same name from `CMakeLists.txt`.
