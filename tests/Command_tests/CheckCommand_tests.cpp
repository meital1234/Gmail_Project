#include "commands/AddCommand.h"
#include "commands/CheckCommand.h"
#include "commands/DeleteCommand.h"
#include "hash/IterativeStdHash.h"
#include "BloomFilterLogic/BloomFilter.h"
#include <gtest/gtest.h>
#include <unordered_set>
#include <fstream>
#include <cstdio>

// helper function to clean test output files
static void removeTestFiles() {
    std::remove("../data/bloomfilter_state.dat");
    std::remove("../data/blacklist_urls.txt");
}

// TEST 1 – Empty URL should be rejected with 400 Bad Request
TEST(CheckCommandTests, EmptyStringCheck_ShouldReturnBadRequest) {
    removeTestFiles();

    BloomFilter bloom(256, { new IterativeStdHash(1) });
    std::unordered_set<std::string> blacklist;

    CheckCommand cmd(&bloom, &blacklist);
    CommandResult res = cmd.execute("");
    EXPECT_EQ(res.statusCode, StatusCode::BadRequest);
}

// TEST 2 – URL only in Bloom filter (false-positive scenario) → status 200 OK, bloomMatch=true, blackMatch=false
TEST(CheckCommandTests, URL_OnlyInBloom_ShouldReturnTrueFalse) {
    removeTestFiles();

    BloomFilter bloom(128, { new IterativeStdHash(1) });
    std::unordered_set<std::string> blacklist;

    std::string url = "suspicious.com";
    bloom.add(url);  // Now bloom says “yes”

    CheckCommand cmd(&bloom, &blacklist);
    CommandResult res = cmd.execute(url);

    EXPECT_EQ(res.statusCode, StatusCode::OK);
    EXPECT_TRUE(res.bloomMatch);
    EXPECT_FALSE(res.blackMatch);
}

// TEST 3 – URL only in blacklist (should be negative) → status 404 Not Found, bloomMatch=false, blackMatch=true
TEST(CheckCommandTests, OnlyInBlacklist_ShouldReturnFalseTrue) {
    removeTestFiles();

    BloomFilter bloom(256, { new IterativeStdHash(1) });
    std::unordered_set<std::string> blacklist = { "only-in-blacklist.com" };

    CheckCommand cmd(&bloom, &blacklist);
    CommandResult res = cmd.execute("only-in-blacklist.com");

    EXPECT_EQ(res.statusCode, StatusCode::NotFound);
    EXPECT_FALSE(res.bloomMatch);
    EXPECT_TRUE(res.blackMatch);
}

// TEST 4 – URL in neither structure → status 404 Not Found, bloomMatch=false, blackMatch=false
TEST(CheckCommandTests, CheckURL_NotAdded_ShouldReturnFalseFalse) {
    removeTestFiles();

    BloomFilter bloom(256, { new IterativeStdHash(1) });
    std::unordered_set<std::string> blacklist = { "known.com" };
    bloom.add("known.com");

    CheckCommand cmd(&bloom, &blacklist);
    CommandResult res = cmd.execute("unknown.com");

    EXPECT_EQ(res.statusCode, StatusCode::NotFound);
    EXPECT_FALSE(res.bloomMatch);
    EXPECT_FALSE(res.blackMatch);
}

// TEST 5 – Detect at least one false positive on a tiny filter
TEST(CheckCommandTests, DetectFalsePositive) {
    removeTestFiles();

    BloomFilter bloom(8, { new IterativeStdHash(1) });
    std::unordered_set<std::string> blacklist;

    std::string added = "www.example.com0";
    bloom.add(added);

    CheckCommand cmd(&bloom, &blacklist);
    bool foundFP = false;

    for (int i = 1; i < 1000; ++i) {
        std::string candidate = "www.example.com" + std::to_string(i);
        if (candidate == added) continue;
        CommandResult res = cmd.execute(candidate);
        if (res.statusCode == StatusCode::OK &&
            res.bloomMatch && !res.blackMatch) {
            foundFP = true;
            break;
        }
    }
    EXPECT_TRUE(foundFP) << "Expected at least one false positive";
}