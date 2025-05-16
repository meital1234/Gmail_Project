#include "commands/AddCommand.h"
#include "hash/IterativeStdHash.h"
#include "BloomFilterLogic/BloomFilter.h"
#include <gtest/gtest.h>
#include <unordered_set>
#include <fstream>
#include <cstdio>
#include <../src/Constants.h>

// Helper: remove any old data files before each test to isolate runs
static void removeTestFiles() {
    std::remove(BLOOM_FILE_PATH.c_str());
    std::remove(BLACKLIST_FILE_PATH.c_str());
}

// TEST 1 - Adding a URL should update both the in-memory blacklist and on-disk BloomFilter file
TEST(AddCommandTests, AddURL_PersistsToBothStructures) {
    removeTestFiles();

    // Create a fresh BloomFilter and empty blacklist
    BloomFilter bloom(256, { new IterativeStdHash(1) });
    std::unordered_set<std::string> blacklist;

    std::string url = "example.com";
    AddCommand cmd(&bloom, &blacklist, BLACKLIST_FILE_PATH, BLOOM_FILE_PATH);

    // Execute the add
    CommandResult res = cmd.execute(url);
    // Expect 201 Created and no bloom/blackMatch flags set
    EXPECT_EQ(res.statusCode, StatusCode::Created);
    EXPECT_FALSE(res.bloomMatch);
    EXPECT_FALSE(res.blackMatch);

    // In-memory blacklist must contain the URL
    EXPECT_TRUE(blacklist.count(url) > 0);

    // On-disk BloomFilter must report the URL as present
    BloomFilter loaded(256, { new IterativeStdHash(1) });
    loaded.loadFromFile(BLOOM_FILE_PATH);
    EXPECT_TRUE(loaded.mightContain(url));
}

// TEST 2 - Adding the same URL twice should not duplicate it in the blacklist file
TEST(AddCommandTests, AddSameURL_Twice_ShouldNotDuplicate) {
    removeTestFiles();

    BloomFilter bloom(256, { new IterativeStdHash(1) });
    std::unordered_set<std::string> blacklist;
    std::string url = "repeat.com";

    AddCommand cmd(&bloom, &blacklist, BLACKLIST_FILE_PATH, BLOOM_FILE_PATH);

    // First add
    CommandResult r1 = cmd.execute(url);
    EXPECT_EQ(r1.statusCode, StatusCode::Created);

    // Second add, should still report Created but not duplicate in file
    CommandResult r2 = cmd.execute(url);
    EXPECT_EQ(r2.statusCode, StatusCode::Created);

    // Count occurrences in the file
    std::ifstream file(BLACKLIST_FILE_PATH);
    int occurrences = 0;
    std::string line;
    while (std::getline(file, line)) {
        if (line == url) occurrences++;
    }
    EXPECT_EQ(occurrences, 1) << "URL should appear exactly once in the blacklist file";
}

// TEST 3 - After add, the URL must appear in the blacklist file on disk
TEST(AddCommandTests, AddedURL_WrittenToBlacklistFile) {
    removeTestFiles();

    BloomFilter bloom(128, { new IterativeStdHash(1) });
    std::unordered_set<std::string> blacklist;
    std::string url = "www.example.com";

    AddCommand cmd(&bloom, &blacklist, BLACKLIST_FILE_PATH, BLOOM_FILE_PATH);
    CommandResult res = cmd.execute(url);
    EXPECT_EQ(res.statusCode, StatusCode::Created);

    // Verify on-disk file
    std::ifstream file(BLACKLIST_FILE_PATH);
    bool found = false;
    std::string line;
    while (std::getline(file, line)) {
        if (line == url) {
            found = true;
            break;
        }
    }
    EXPECT_TRUE(found) << "Added URL should be written to the blacklist file";
}