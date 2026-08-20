# Cpp + CMake template

Opinionated C++ project starter with CMake build system.

## Requirements

- CMake 3.20+
- Node.js
- GCC, Clang, or MSVC
- VS Code C/C++ or CMake Tools extension

## CLI behavior

- `kunver-new` runs `cmake -S . -B build` automatically after creating the project when CMake is available.
- If that step fails, the project is still created and you can run the command manually.

## Manager bridge

- `node manager.cjs dev` configures, builds, and runs the app.
- `node manager.cjs build` configures if needed, then builds.
- `node manager.cjs run` runs the latest built executable.
- `node manager.cjs rebuild` deletes `build/`, then configures and builds again.
- `node manager.cjs clean` deletes `build/`.
- `node manager.cjs doctor` checks required files.

## Raw CMake usage

- Configure: `cmake -S . -B build`
- Build: `cmake --build build`
- Run: use the executable generated inside `build/` by your chosen CMake generator.

Note: `kunver` rewrites the CMake project name to the folder name you enter during creation, and `manager.cjs` reads that same name from `CMakeLists.txt`.
