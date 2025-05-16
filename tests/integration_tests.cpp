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
#include "CLIhandler/CLI_handler.h"  // Include the CLIHandler class we are testing
#include <gtest/gtest.h>  // Include Google Test framework
#include "../src/BloomFilterLogic/BloomFilter.h"

// Helper to ensure ../data directory exists
void ensureDataDirExists() {
    system("mkdir -p ../data");
}

// Helper function to delete output files before each test run.
// Prevents interference from previous runs.
void removeTestFiles() {
    std::remove("../data/bloomfilter_state.dat");
    std::remove("../data/blacklist_urls.txt");
}

void ensureDataFilesExist() {
    std::ofstream("../data/blacklist_urls.txt", std::ios::app).close();  // creates if not exists
    std::ofstream("../data/bloomfilter_state.dat", std::ios::app).close();  // creates if not exists
}

// Simple helper to ensure blacklist file exists (without filesystem)
void ensureBlacklistFileExists(const std::string& path) {
    std::ifstream infile(path);
    if (!infile.good()) {
        std::ofstream outfile(path);  // create empty file
        if (!outfile.is_open()) {
            std::cerr << "[TestSetup] Error: Could not create file: " << path << std::endl;
        } else {
            std::cout << "[TestSetup] Created missing file: " << path << std::endl;
        }
    }
}

// TEST 1 
TEST(CLIHandlerTest, ValidInput_Minimal) {
    removeTestFiles();
    CLIHandler handler;
    std::string config = "128 1";
    handler.loadOrInitializeBloomFilter(config);
    SUCCEED();
}

// TEST 2
TEST(CLIHandlerTest, ValidInput_MultipleHashFunctions) {
    removeTestFiles();
    CLIHandler handler;
    std::string config = "256 1 2 1";
    handler.loadOrInitializeBloomFilter(config);
    SUCCEED();
}

// TEST 3
TEST(CLIHandlerTest, InvalidInput_OnlyBitSize) {
    removeTestFiles();
    CLIHandler handler;
    std::string config = "128";
    bool result = handler.loadOrInitializeBloomFilter(config);
    EXPECT_FALSE(result);
}

// TEST 4
TEST(CLIHandlerTest, InvalidInput_ZeroBitSize) {
    removeTestFiles();
    CLIHandler handler;
    std::string config = "0 1";
    bool result = handler.loadOrInitializeBloomFilter(config);
    EXPECT_FALSE(result);
}

// TEST 5
TEST(CLIHandlerTest, InvalidInput_NegativeHash) {
    removeTestFiles();
    CLIHandler handler;
    std::string config = "256 -1";
    bool result = handler.loadOrInitializeBloomFilter(config);
    EXPECT_FALSE(result);
}

// Test 6
TEST(CLIHandlerIntegration, HandleCommand_ADD_ShouldCallAddCommand) {
    ensureDataFilesExist();

    CLIHandler handler;
    handler.loadOrInitializeBloomFilter("8 1");
    handler.registerCommands();
    
    std::string dummyOutput;
    CommandResult result = handler.handleCommand("POST test.com", dummyOutput);

    EXPECT_TRUE(result.GoodCommand);
}

// Test 7
TEST(CLIHandlerIntegration, HandleCommand_CHECK_ShouldOutputCorrectResult) {
    ensureDataFilesExist();

    CLIHandler handler;
    handler.loadOrInitializeBloomFilter("8 1");
    handler.registerCommands();

    std::string dummyOutput;
    handler.handleCommand("POST trusted.com", dummyOutput);

    CommandResult checkResult = handler.handleCommand("GET trusted.com", dummyOutput);

    EXPECT_TRUE(checkResult.GoodCommand);
    EXPECT_EQ(dummyOutput, "true true");
}

// Test 8
TEST(CLIHandler_HandleCommand, DeleteCommand_RemovesURL_FromMemoryAndFile) {
    removeTestFiles();
    CLIHandler handler;
    ASSERT_TRUE(handler.loadOrInitializeBloomFilter("128 1"));
    handler.registerCommands();

    std::ofstream out("../data/blacklist_urls.txt");
    out << "bad.com\n";
    out.close();

    handler.loadBlacklistFromFile();

    std::string dummyOutput;
    ASSERT_TRUE(handler.handleCommand("DELETE bad.com", dummyOutput).GoodCommand);

    std::ifstream in("../data/blacklist_urls.txt");
    std::string line;
    bool found = false;
    while (std::getline(in, line)) {
        if (line == "bad.com") {
            found = true;
            break;
        }
    }
    EXPECT_FALSE(found);
}