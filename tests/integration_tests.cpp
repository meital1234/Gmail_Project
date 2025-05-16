// Test 1 - Minimal valid input (bit size + 1 hash function)
// Test 2 - Valid input with multiple hash functions
// Test 3 - Invalid: only bit size, no hash functions
// Test 4 - Invalid: zero bit size
// Test 5 - Invalid: negative hash function ID
// Test 6 - Valid AddCommand adds URL to both memory and blacklist file
// Test 7 - Valid CheckCommand finds URL in both BloomFilter and blacklist → if OK it prints "true true"
// Test 8 - Valid DeleteCommand removes URL from both memory and blacklist file

#include <sstream>
#include <fstream>
#include <string>
#include <cstdio>
#include <gtest/gtest.h>  // Include Google Test framework
#include "CLIhandler/CLI_handler.h"  // Include the CLIHandler class we are testing

#include "../src/commands/CommandResult.h"
#include "../src/BloomFilterLogic/BloomFilter.h"

// Helper function to delete output files before each test run.
// Prevents interference from previous runs.
void removeTestFiles() {
    std::remove("../data/bloomfilter_state.dat");
    std::remove("../data/blacklist_urls.txt");
}

// Helper function: create empty files if missing
void ensureDataFilesExist() {
    std::ofstream("../data/blacklist_urls.txt", std::ios::app).close();  // creates if not exists
    std::ofstream("../data/bloomfilter_state.dat", std::ios::app).close();  // creates if not exists
}

// Test 1: minimal valid input for config line: bit size + one hash function
TEST(CLIHandlerTest, ValidInput_Minimal) {
    removeTestFiles();  // reset files
    CLIHandler handler;  // create handler
    std::string config = "128 1";  // minimal valid config
    bool result = handler.loadOrInitializeBloomFilter(config);
    EXPECT_TRUE(result);  // should succeed
}

// Test 2: valid input with multiple hash functions
TEST(CLIHandlerTest, ValidInput_MultipleHashFunctions) {
    removeTestFiles();   // reset files
    CLIHandler handler;
    std::string config = "256 1 2 1";  // multiple hash types
    bool result = handler.loadOrInitializeBloomFilter(config);
    EXPECT_TRUE(result);  // should succeed
}

// Test 3: invalid input with only bit size and no hash function
TEST(CLIHandlerTest, InvalidInput_OnlyBitSize) {
    removeTestFiles();  // reset files
    CLIHandler handler;
    std::string config = "128";   // missing hash count
    bool result = handler.loadOrInitializeBloomFilter(config);
    EXPECT_FALSE(result);  // should fail
}

// Test 4: invalid input with zero bit size
TEST(CLIHandlerTest, InvalidInput_ZeroBitSize) {
    removeTestFiles();
    CLIHandler handler;
    std::string config = "0 1";  // bit size zero
    bool result = handler.loadOrInitializeBloomFilter(config);
    EXPECT_FALSE(result);  // should fail
}

// Test 5: Invalid configuration (negative hash function ID)
TEST(CLIHandlerTest, InvalidInput_NegativeHash) {
    removeTestFiles();
    CLIHandler handler;
    std::string config = "256 -1"; // Negative hash ID
    bool result = handler.loadOrInitializeBloomFilter(config);
    EXPECT_FALSE(result);  // Expect failure
}

// Test 6: POST command should return Created (201) and not set bloom/black flags
TEST(CLIHandlerIntegration, HandleCommand_POST_ReturnsCreated) {
    removeTestFiles();  // Clear previous state
    ensureDataFilesExist();  // Create necessary files

    CLIHandler handler;
    handler.loadOrInitializeBloomFilter("8 1");  // Initialize filter
    handler.registerCommands();   // Register command handlers

    // Execute POST and capture result
    CommandResult res = handler.handleCommand("POST test.com");
    EXPECT_EQ(res.statusCode, StatusCode::Created); // Expect HTTP 201 Created
    EXPECT_FALSE(res.bloomMatch);  // bloomMatch should be default false
    EXPECT_FALSE(res.blackMatch);  // blackMatch should be default false
}

// Test 7: GET after POST should return OK (200) with bloomMatch=true and blackMatch=true
TEST(CLIHandlerIntegration, HandleCommand_GET_ReturnsTrueTrue) {
    removeTestFiles();  // Clear previous state
    ensureDataFilesExist();  // Create necessary files

    CLIHandler handler;
    handler.loadOrInitializeBloomFilter("8 1");  // Initialize filter
    handler.registerCommands();  // Register command handlers

    handler.handleCommand("POST trusted.com");  // First, add the URL
    CommandResult res = handler.handleCommand("GET trusted.com"); // Then, check it

    EXPECT_EQ(res.statusCode, StatusCode::OK);  // Expect HTTP 200 OK
    EXPECT_TRUE(res.bloomMatch);  // Bloom filter should contain the URL
    EXPECT_TRUE(res.blackMatch);  // Blacklist should contain the URL
}

// Test 8: DELETE command should remove URL and return NoContent (204)
TEST(CLIHandlerIntegration, HandleCommand_DELETE_ReturnsNoContent) {
    removeTestFiles();  // Clear previous state
    ensureDataFilesExist();  // Create necessary files

    // Pre-populate blacklist file with 'bad.com'
    {
        std::ofstream out("../data/blacklist_urls.txt");
        out << "bad.com\n";
    }

    CLIHandler handler;
    handler.loadOrInitializeBloomFilter("8 1");  // Initialize filter
    handler.loadBlacklistFromFile();  // Load existing blacklist entries
    handler.registerCommands();  // Register command handlers

    // Execute DELETE on the existing URL
    CommandResult res = handler.handleCommand("DELETE bad.com");
    EXPECT_EQ(res.statusCode, StatusCode::NoContent); // Expect HTTP 204 No Content

    // Verify that 'bad.com' is no longer present in the blacklist file
    std::ifstream inFile("../data/blacklist_urls.txt");
    bool found = false;
    std::string line;
    while (std::getline(inFile, line)) {
        if (line == "bad.com") found = true;
    }
    EXPECT_FALSE(found);  // URL should be removed
}
