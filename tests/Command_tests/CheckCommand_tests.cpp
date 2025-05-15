#include "commands/CheckCommand.h"
#include "hash/IterativeStdHash.h"
#include "BloomFilterLogic/BloomFilter.h"
#include <gtest/gtest.h>
#include <unordered_set>
#include <sstream>
#include <cstdio>

// Define a helper function to clean test output files
static void removeTestFiles() {
    std::remove("../data/bloomfilter_state.dat");
    std::remove("../data/blacklist_urls.txt");
}

// TEST 1 - Empty input string → always "false"
TEST(CheckCommandTests, EmptyStringCheck_ShouldReturnFalse) {
    removeTestFiles();

    BloomFilter bloom(256, { new IterativeStdHash(1) });
    std::unordered_set<std::string> blacklist;

    CheckCommand cmd(&bloom, &blacklist);

    testing::internal::CaptureStdout();
    cmd.execute("");
    std::string output = testing::internal::GetCapturedStdout();

    EXPECT_EQ(output, "false");
}

// TEST 2 - URL only in Bloom filter → "true false"
TEST(CheckCommandTests, URL_OnlyInBloom_ShouldReturnTrueFalse) {
    removeTestFiles();

    BloomFilter bloom(128, { new IterativeStdHash(1) });
    std::unordered_set<std::string> blacklist;

    std::string url = "suspicious.com";
    bloom.add(url);

    CheckCommand cmd(&bloom, &blacklist);

    testing::internal::CaptureStdout();
    cmd.execute(url);
    std::string output = testing::internal::GetCapturedStdout();

    EXPECT_EQ(output, "true false");
}

// TEST 3 - URL only in blacklist → "false" or "false true"
TEST(CheckCommandTests, OnlyInBlacklist_ShouldReturnFalseTrueOrFalse) {
    removeTestFiles();

    BloomFilter bloom(256, { new IterativeStdHash(1) });
    std::unordered_set<std::string> blacklist = { "only-in-blacklist.com" };

    CheckCommand cmd(&bloom, &blacklist);

    testing::internal::CaptureStdout();
    cmd.execute("only-in-blacklist.com");
    std::string result = testing::internal::GetCapturedStdout();

    EXPECT_TRUE(result == "false" || result == "false true");
}

// TEST 4 - Unknown URL not in Bloom or blacklist → "false" or "true false"
TEST(CheckCommandTests, CheckURL_NotAdded_ShouldBehaveAsExpected) {
    removeTestFiles();

    BloomFilter bloom(256, { new IterativeStdHash(1) });
    std::unordered_set<std::string> blacklist = { "known.com" };

    bloom.add("known.com");

    CheckCommand cmd(&bloom, &blacklist);

    testing::internal::CaptureStdout();
    cmd.execute("unknown.com");
    std::string result = testing::internal::GetCapturedStdout();

    EXPECT_TRUE(result == "false" || result == "true false");
}

// TEST 5 - Detect false positive with small Bloom filter
TEST(CheckCommandTests, DetectFalsePositive) {
    removeTestFiles();

    BloomFilter bloom(8, { new IterativeStdHash(1) });
    std::unordered_set<std::string> blacklist;

    std::string added = "www.example.com0";
    bloom.add(added);

    CheckCommand cmd(&bloom, &blacklist);
    bool falsePositiveFound = false;

    for (int i = 1; i < 1000; ++i) {
        std::string candidate = "www.example.com" + std::to_string(i);
        if (candidate == added) continue;

        testing::internal::CaptureStdout();
        cmd.execute(candidate);
        std::string result = testing::internal::GetCapturedStdout();

        if (result == "true false") {
            falsePositiveFound = true;
            break;
        }
    }

    EXPECT_TRUE(falsePositiveFound);
}
