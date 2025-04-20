#include <sstream>
#include <fstream>
#include <string>
#include <cstdio>
#include "CLI_handler.h"      // Include the CLIHandler class we are testing
#include <gtest/gtest.h>      // Include Google Test framework
#include "../src/BloomFilterLogic/BloomFilter.h"



// Helper function to delete output files before each test run.
// Prevents interference from previous runs.
void removeTestFiles() {
    std::remove("data/bloomfilter_state.dat");
    std::remove("data/blacklist_urls.txt");
}

// TEST 1 
// Test with minimal valid input: bitArraySize + 1 hash function
TEST(CLIHandlerTest, ValidInput_Minimal) {
    removeTestFiles();                      // Clean previous output files
    CLIHandler handler;                     // Create a new CLIHandler instance
    std::string config = "128 1";           // Configuration line: array of size 128 bits, 1 hash
    handler.loadOrInitializeBloomFilter(config); // Run the function we're testing
    SUCCEED();                              // If no exception or crash occurred, the test passes
}

// TEST 2
// Test with multiple hash functions: bitArraySize + multiple hash IDs
TEST(CLIHandlerTest, ValidInput_MultipleHashFunctions) {
    removeTestFiles();                      // Clean any leftover files
    CLIHandler handler;                     // Create CLI handler
    std::string config = "256 1 2 1";       // 256-bit filter, 3 hash functions (IDs 1,2,1)
    handler.loadOrInitializeBloomFilter(config); // Execute function
    SUCCEED();                              // Just ensure no crash
}

// TEST 3 
// Test invalid input: only bit array size provided (missing hash functions)
TEST(CLIHandlerTest, InvalidInput_OnlyBitSize) {
    removeTestFiles();
    CLIHandler handler;
    std::string config = "128";             // Invalid: missing hash function(s)

    // Capture standard error output to check for error message
    testing::internal::CaptureStderr();     // Begin capturing std::cerr
    handler.loadOrInitializeBloomFilter(config); // Run the function
    std::string output = testing::internal::GetCapturedStderr(); // Get captured output

    // Make sure the error message contains a specific phrase
    EXPECT_NE(output.find("at least one hash function"), std::string::npos);
}

// TEST 4
// Test invalid input: zero as bit array size (not allowed)
TEST(CLIHandlerTest, InvalidInput_ZeroBitSize) {
    removeTestFiles();
    CLIHandler handler;
    std::string config = "0 1";             // Invalid: 0-bit array size

    testing::internal::CaptureStderr();     // Capture std::cerr
    handler.loadOrInitializeBloomFilter(config); // Run
    std::string output = testing::internal::GetCapturedStderr(); // Get error

    // Check that error mentions 'bit array size'
    EXPECT_NE(output.find("bit array size"), std::string::npos);
}

// TEST 5
// Test invalid input: negative hash function ID
TEST(CLIHandlerTest, InvalidInput_NegativeHash) {
    removeTestFiles();
    CLIHandler handler;
    std::string config = "256 -1";          // Invalid: -1 is not a valid hash type

    testing::internal::CaptureStderr();     // Start capturing error stream
    handler.loadOrInitializeBloomFilter(config); // Run the method
    std::string output = testing::internal::GetCapturedStderr(); // Grab captured output

    // Ensure error mentions that hash IDs must be positive
    EXPECT_NE(output.find("hash function identifiers"), std::string::npos);
}

// TEST 6
// This test checks that processAdd and processCheck actually affect the bloom filter and blacklist.
// It captures the printed output and verifies correctness.
TEST(CLIHandlerTest, AddAndCheckURL) {
    removeTestFiles();                      // Clean any leftover files

    CLIHandler handler;                     // Create CLI handler
    std::string config = "256 1";           // Initialize with valid configuration
    handler.loadOrInitializeBloomFilter(config);  // Initialize bloom filter

    std::string url = "example.com";

    // Add a URL to the bloom filter and blacklist
    handler.processAdd(url);

    // Capture standard output of processCheck
    testing::internal::CaptureStdout();     // Start capturing std::cout
    handler.processCheck(url);              // Check if the URL is found
    std::string output = testing::internal::GetCapturedStdout(); // Get printed output

    // The output should be: "true true\n" since the bloom filter and the blacklist both confirm it
    EXPECT_EQ(output, "true true\n");
}

// TEST 7
// This test checks that checking a URL that was never added behaves as expected.
// It verifies both "false" (definitely not present) and "true false" (false positive).
TEST(CLIHandlerTest, CheckURL_NotAdded) {
    removeTestFiles();                      // Ensure clean state

    CLIHandler handler;                     // New CLI handler instance
    std::string config = "256 1";           // Initialize with a small bloom filter (more likely to produce false positives)
    handler.loadOrInitializeBloomFilter(config);

    std::string addedURL = "known.com";
    std::string unknownURL = "unknown.com";

    handler.processAdd(addedURL);           // Add only one known URL

    // Capture output of checking an unknown URL
    testing::internal::CaptureStdout();     // Start capturing output
    handler.processCheck(unknownURL);       // Check for unknown URL
    std::string output = testing::internal::GetCapturedStdout();

    // The result may be either:
    // "false\n" – if Bloom filter says it's not present (ideal)
    // "true false\n" – if Bloom filter gives false positive (possible for small filters)

    // We accept both possibilities and assert one of them
    EXPECT_TRUE(output == "false\n" || output == "true false\n");
}

// int main(int argc, char **argv) {
//     ::testing::InitGoogleTest(&argc, argv);
//     return RUN_ALL_TESTS();
// }

