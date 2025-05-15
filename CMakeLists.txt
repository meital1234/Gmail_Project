cmake_minimum_required(VERSION 3.14)
project(TheBestGmailEver)

# Use C++14
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

# Include project headers
include_directories(src)

# Main executable (for running the server normally)
add_executable(main
    src/main.cpp
    src/BloomFilterLogic/BloomFilter.cpp
    src/hash/IterativeStdHash.cpp
    src/CLIhandler/CLI_handler.cpp
    src/server/Server.cpp
    src/commands/AddCommand.cpp
    src/commands/CheckCommand.cpp
    src/commands/DeleteCommand.cpp
)

# Link with ws2_32 for Windows sockets
if (WIN32)
    target_link_libraries(main ws2_32)
endif()

# ---- Unit tests executable ----
enable_testing()

add_executable(runTests
    tests/bloom_tests.cpp
    tests/hash_tests.cpp
    tests/integration_tests.cpp
    tests/server_tests.cpp
    tests/Command_tests/AddCommand_tests.cpp
    tests/Command_tests/CheckCommand_tests.cpp
    tests/Command_tests/DeleteCommand_tests.cpp
    src/BloomFilterLogic/BloomFilter.cpp
    src/hash/IterativeStdHash.cpp
    src/CLIhandler/CLI_handler.cpp
    src/server/Server.cpp
    src/commands/AddCommand.cpp
    src/commands/CheckCommand.cpp
    src/commands/DeleteCommand.cpp
)

# Link libraries to runTests
target_link_libraries(runTests
    gtest_main
)

# Link ws2_32 for sockets in tests (Windows)
if (WIN32)
    target_link_libraries(runTests ws2_32)
endif()

# pthread for POSIX systems (Linux/macOS)
if (UNIX AND NOT APPLE)
    target_link_libraries(runTests pthread)
endif()

# Auto-discover and run tests
include(GoogleTest)
gtest_discover_tests(runTests)
