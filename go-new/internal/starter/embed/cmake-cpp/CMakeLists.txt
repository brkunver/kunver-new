cmake_minimum_required(VERSION 3.20)

project(cmake_cpp_template LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

add_executable(${PROJECT_NAME}
  src/main.cpp
  src/example.cpp
)

target_include_directories(${PROJECT_NAME} PRIVATE include)