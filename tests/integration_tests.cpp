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

    bool result = handler.loadOrInitializeBloomFilter(config);

    // Expect initialization to fail (false)
    EXPECT_FALSE(result);

    // Capture standard error output to check for error message
    // testing::internal::CaptureStderr();     // Begin capturing std::cerr
    // handler.loadOrInitializeBloomFilter(config); // Run the function
    // std::string output = testing::internal::GetCapturedStderr(); // Get captured output

    // // Make sure the error message contains a specific phrase
    // EXPECT_NE(output.find("at least one hash function"), std::string::npos);
}

// TEST 4
// Test invalid input: zero as bit array size (not allowed)
TEST(CLIHandlerTest, InvalidInput_ZeroBitSize) {
    removeTestFiles();
    CLIHandler handler;
    std::string config = "0 1";             // Invalid: 0-bit array size

    bool result = handler.loadOrInitializeBloomFilter(config);

    // Expect initialization to fail
    EXPECT_FALSE(result);

    // testing::internal::CaptureStderr();     // Capture std::cerr
    // handler.loadOrInitializeBloomFilter(config); // Run
    // std::string output = testing::internal::GetCapturedStderr(); // Get error

    // // Check that error mentions 'bit array size'
    // EXPECT_NE(output.find("bit array size"), std::string::npos);
}

// TEST 5
// Test invalid input: negative hash function ID
TEST(CLIHandlerTest, InvalidInput_NegativeHash) {
    removeTestFiles();
    CLIHandler handler;
    std::string config = "256 -1";  // Invalid: -1 is not a valid hash type

    bool result = handler.loadOrInitializeBloomFilter(config);

    // Expect initialization to fail
    EXPECT_FALSE(result);

    // testing::internal::CaptureStderr();     // Start capturing error stream
    // handler.loadOrInitializeBloomFilter(config); // Run the method
    // std::string output = testing::internal::GetCapturedStderr(); // Grab captured output

    // // Ensure error mentions that hash IDs must be positive
    // EXPECT_NE(output.find("hash function identifiers"), std::string::npos);
}

// TEST 6
// This test verifies that CLIHandler interprets the "ADD" command correctly
// and passes it to the AddCommand object, which updates BloomFilter & blacklist
TEST(CLIHandlerIntegration, HandleCommand_ADD_ShouldCallAddCommand) {
    removeTestFiles();  // clean files from previous runs

    CLIHandler handler;  // create new CLIHandler
    handler.loadOrInitializeBloomFilter("128 1");  // load minimal config

    handler.registerCommands();

    //handler.handleCommand("POST test.com");  // simulate user input command
    ASSERT_TRUE(handler.handleCommand("POST test.com"));

    // ensure that "test.com" was added to the in-memory blacklist
    EXPECT_TRUE(handler.blacklistUrls.count("test.com") > 0);  // must be in set

    // read blacklist file and confirm persistence
    std::ifstream file("data/blacklist_urls.txt");
    std::string line;
    bool found = false;
    while (std::getline(file, line)) {
        if (line == "test.com") {
            found = true;
            break;
        }
    }
    EXPECT_TRUE(found);  // URL should appear in file as well
}

// TEST 7
// This test checks that CLIHandler passes a "CHECK" command correctly to CheckCommand,
// and that the correct output ("true true") is printed when URL exists in both BloomFilter and blacklist
TEST(CLIHandlerIntegration, HandleCommand_CHECK_ShouldOutputCorrectResult) {
    removeTestFiles();  // remove previous files

    CLIHandler handler;
    handler.loadOrInitializeBloomFilter("128 1");

    handler.registerCommands();

    // simulate adding a URL to Bloom & blacklist
    handler.handleCommand("POST trusted.com");

    // redirect stdout to capture printed result
    testing::internal::CaptureStdout();
    handler.handleCommand("GET trusted.com");
    std::string output = testing::internal::GetCapturedStdout();

    EXPECT_EQ(output, "true true\n");  // must return "true true"
}

// TEST 8
// This test checks that CLIHandler dirests DELETE command to DeleteCommand
// and that URL is removed from both memory and blacklist
TEST(CLIHandler_HandleCommand, DeleteCommand_RemovesURL_FromMemoryAndFile) {
    removeTestFiles();  // Clean previous test files

    CLIHandler handler;

    // initialize BloomFilter (making sure valid config)
    std::string config = "128 1";
    ASSERT_TRUE(handler.loadOrInitializeBloomFilter(config));  // config: 128-bit, 1 hash

    handler.registerCommands();

    // insert URL into blacklist and memory
    std::ofstream out("data/blacklist_urls.txt");
    out << "bad.com\n";  // write test URL to file
    out.close();

   // make sure blacklist in memory also contains "bad.com" (normally happens in run())
    handler.loadBlacklistFromFile();  // we load file to memory so blacklist will contain "bad.com"

    // Step 3: simulate command line input to delete the URL
    handler.handleCommand("DELETE bad.com");

    // check that URL is no longer in file
    std::ifstream in("data/blacklist_urls.txt");
    std::string line;
    bool found = false;  // flag that marks that URL to be found in blacklist
    while (std::getline(in, line)) {  // read blacklist line-line
        if (line == "bad.com") {  // checks each line if is test URL
            found = true;  // if test URL is found we stop checking
            break;
        }
    }

    EXPECT_FALSE(found);  // URL should not be in file anymore
}


// int main(int argc, char **argv) {
//     ::testing::InitGoogleTest(&argc, argv);
//     return RUN_ALL_TESTS();
// }