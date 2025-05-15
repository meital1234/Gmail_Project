#include "commands/AddCommand.h"
#include "hash/IterativeStdHash.h"
#include "BloomFilterLogic/BloomFilter.h"
#include <gtest/gtest.h>
#include <unordered_set>
#include <fstream>
#include <cstdio>

// Define a helper function to clean test output files
static void removeTestFiles() {
    std::remove("../data/bloomfilter_state.dat");
    std::remove("../data/blacklist_urls.txt");
}

// TEST 1 - Add URL affects both Bloom filter and blacklist
TEST(AddCommandTests, AddURL_PersistsToBothStructures) {
    removeTestFiles();

    BloomFilter bloom(256, { new IterativeStdHash(1) });
    std::unordered_set<std::string> blacklist;
    std::string url = "example.com";

    AddCommand cmd(&bloom, &blacklist, "blacklist_urls.txt", "bloomfilter_state.dat");
    cmd.execute(url);

    EXPECT_TRUE(blacklist.count(url) > 0);

    BloomFilter loaded(256, { new IterativeStdHash(1) });
    loaded.loadFromFile("bloomfilter_state.dat");
    EXPECT_TRUE(loaded.mightContain(url));
}

// TEST 2 - Adding the same URL twice does not duplicate in blacklist file
TEST(AddCommandTests, AddSameURL_Twice_ShouldNotDuplicate) {
    removeTestFiles();

    BloomFilter bloom(256, { new IterativeStdHash(1) });
    std::unordered_set<std::string> blacklist;
    std::string url = "repeat.com";

    AddCommand cmd(&bloom, &blacklist, "blacklist_urls.txt", "bloomfilter_state.dat");
    cmd.execute(url);
    cmd.execute(url);

    std::ifstream file("blacklist_urls.txt");
    std::string line;
    int count = 0;

    while (std::getline(file, line)) {
        if (line == url) count++;
    }

    EXPECT_EQ(count, 1);
}

// TEST 3 - Added URL appears in blacklist file on disk
TEST(AddCommandTests, AddedURL_WrittenToBlacklistFile) {
    removeTestFiles();

    BloomFilter bloom(128, { new IterativeStdHash(1) });
    std::unordered_set<std::string> blacklist;
    std::string url = "www.example.com";

    AddCommand cmd(&bloom, &blacklist, "../blacklist_urls.txt", "../bloomfilter_state.dat");
    cmd.execute(url);

    std::ifstream file("blacklist_urls.txt");
    std::string line;
    bool found = false;

    while (std::getline(file, line)) {
        if (line == url) {
            found = true;
            break;
        }
    }

    EXPECT_TRUE(found);
}
