// Test 1 - Empty input string → always "false"
// Test 2 - URL only in Bloom filter → "true false"
// Test 3 - URL only in blacklist → "false" or "false true"
// Test 4 - Unknown URL not in Bloom or blacklist → "false" or "true false"
// Test 5 - Detect false positive with small Bloom filter

#include "commands/CheckCommand.h"
#include "hash/IterativeStdHash.h"
#include "BloomFilterLogic/BloomFilter.h"
#include <gtest/gtest.h>
#include <unordered_set>
#include <sstream>
#include <cstdio>

// Define a helper function to clean test output files
static void removeTestFiles() {
    std::remove("data/bloomfilter_state.dat");  // Remove saved BloomFilter
    std::remove("data/blacklist_urls.txt");     // Remove saved blacklist
}

// TEST 1
// This test checks an empty string – expected result is "false"
TEST(empty_string_check, EmptyStringCheck_ShouldReturnFalse) {
    removeTestFiles();  // Ensure a clean environment by deleting previous data files

    BloomFilter bloom(256, { new IterativeStdHash(1) });  // Create a BloomFilter with 256 bits and one hash function
    std::unordered_set<std::string> blacklist;  // Initialize an empty in-memory blacklist

    CheckCommand cmd(&bloom, &blacklist);  // Initialize the CheckCommand with Bloom filter and blacklist

    testing::internal::CaptureStdout();  // Capture printed output
    cmd.execute("");  // Execute the check with an empty string as input
    std::string output = testing::internal::GetCapturedStdout();

    EXPECT_EQ(output, "false\n");  // Expect the result to be "false" (empty string should never be found)
}

// TEST 2
// this test checks if URL is found only in BloomFilter (not in blacklist) -> returns 'true false'
TEST(only_in_bloom, URL_OnlyInBloom_ShouldReturnTrueFalse) {
    removeTestFiles();

    BloomFilter bloom(128, { new IterativeStdHash(1) });  // create BloomFilter
    std::unordered_set<std::string> blacklist;  // no blacklist entry

    std::string url = "suspicious.com";
    bloom.add(url);  // add only to Bloom

    CheckCommand cmd(&bloom, &blacklist);

    testing::internal::CaptureStdout();
    cmd.execute(url);  // check it
    std::string output = testing::internal::GetCapturedStdout();

    EXPECT_EQ(output, "true false\n");  // should show true (Bloom), false (blacklist)
}

// TEST 3
// this test checks if URL is found only in  blacklist (but not in Bloom) -> returns false or false true
TEST(only_in_blacklist, OnlyInBlacklist_ShouldReturnFalseTrueOrFalse) {
    removeTestFiles();  // reset

    BloomFilter bloom(256, { new IterativeStdHash(1) });  // create filter
    std::unordered_set<std::string> blacklist;  // create blacklist
    std::string url = "only-in-blacklist.com";
    blacklist.insert(url);  // insert to blacklist only

    CheckCommand cmd(&bloom, &blacklist);

    testing::internal::CaptureStdout();
    cmd.execute(url);  // check it
    std::string result = testing::internal::GetCapturedStdout();

    EXPECT_TRUE(result == "false\n" || result == "false true\n");  // acceptable outcomes
}

// TEST 4
// This test checks that checking a URL that was never added behaves as expected.
// It verifies both "false" (definitely not present) and "true false" (false positive).
TEST(CheckCommand_FromIntegration, CheckURL_NotAdded_ShouldBehaveAsExpected) {
    removeTestFiles();  // Start clean

    BloomFilter bloom(256, { new IterativeStdHash(1) });  // Create BloomFilter
    std::unordered_set<std::string> blacklist;  // Create blacklist

    bloom.add("known.com");  // Add a known URL
    blacklist.insert("known.com");

    CheckCommand cmd(&bloom, &blacklist);  // Create CheckCommand

    testing::internal::CaptureStdout();
    cmd.execute("unknown.com");  // Check an unknown URL
    std::string result = testing::internal::GetCapturedStdout();

    EXPECT_TRUE(result == "false\n" || result == "true false\n");  // Accept both valid results
}

// TEST 5
// This test checks that the Bloom Filter can return false positive
TEST(detect_false_positive, DetectFalsePositive) {
    removeTestFiles();  // Clean test environment

    BloomFilter bloom(8, { new IterativeStdHash(1) });  // Tiny filter = high false positive chance
    std::unordered_set<std::string> blacklist;  // Create empty blacklist

    std::string added = "www.example.com0";
    bloom.add(added);  // Add one real entry

    CheckCommand cmd(&bloom, &blacklist);  // Reusable command
    bool falsePositiveFound = false;

    for (int i = 1; i < 1000; ++i) {  // Try many test cases
        std::string candidate = "www.example.com" + std::to_string(i);
        if (candidate == added) continue;

        CheckCommand check(&bloom, &blacklist);  // New command each time
        testing::internal::CaptureStdout();
        check.execute(candidate);
        std::string result = testing::internal::GetCapturedStdout();

        if (result == "true false\n") {
            falsePositiveFound = true;
            break;
        }
    }

    EXPECT_TRUE(falsePositiveFound);  // At least one false positive expected
}
