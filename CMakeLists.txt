cmake_minimum_required(VERSION 3.14)
project(BloomFilterProjet)

# Use C++14 or later
set(CMAKE_CXX_STANDARD 14)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# GoogleTest setup
include(FetchContent)
FetchContent_Declare(
  googletest
  URL https://github.com/google/googletest/archive/03597a01ee50ed33e9dfd640b249b4be3799d395.zip
)
set(gtest_force_shared_crt ON CACHE BOOL "" FORCE)
FetchContent_MakeAvailable(googletest)

# Include your project headers
include_directories(src)

# ---- Main executable ----
add_executable(main
    src/main.cpp
    src/BloomFilterLogic/BloomFilter.cpp
    src/hash/IterativeStdHash.cpp
    src/CLIhandler/CLI_handler.cpp
)

# ---- Unit tests ----
enable_testing()

add_executable(runTests
    tests/bloom_tests.cpp
    tests/hash_tests.cpp
    tests/integration_tests.cpp
    src/BloomFilterLogic/BloomFilter.cpp
    src/hash/IterativeStdHash.cpp
    src/CLIhandler/CLI_handler.cpp
)

target_link_libraries(runTests
    gtest_main
)

include(GoogleTest)
gtest_discover_tests(runTests)