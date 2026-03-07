# Cpp + CMake template

## Requirements

- CMake 3.20+
- GCC, Clang, or MSVC
- VS Code C/C++ or CMake Tools extension

## CLI behavior

- `kunver` runs `cmake -S . -B build` automatically after creating the project when CMake is available.
- If that step fails, the project is still created and you can run the command manually.

## Usage

- Build: `cmake --build build`
- Run: use the executable generated inside `build/` by your chosen CMake generator.

Note: The project name inside `CMakeLists.txt` is static for now and can be made dynamic later.
