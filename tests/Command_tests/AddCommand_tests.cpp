// Test 1 - Add URL affects both Bloom filter and blacklist
// Test 2 - Adding the same URL twice does not duplicate in blacklist file
// Test 3 - Added URL appears in blacklist file on disk

#include "commands/AddCommand.h"
#include "hash/IterativeStdHash.h"
#include "BloomFilterLogic/BloomFilter.h"
#include <gtest/gtest.h>
#include <unordered_set>
#include <fstream>
#include <cstdio>

// Define a helper function to clean test output files
 static void removeTestFiles() {
    std::remove("bloomfilter_state.dat");  // Delete existing BloomFilter file
    std::remove("blacklist_urls.txt");     // Delete existing blacklist file
}

// TEST 1
// This test checks that processAdd and processCheck actually affect the bloom filter and blacklist.
// It captures the printed output and verifies correctness.
TEST(AddCommand_FromIntegration, AddURL_PersistsToBothStructures) {
    removeTestFiles();  // Clean previous output files

    BloomFilter bloom(256, { new IterativeStdHash(1) });  // Create a new BloomFilter with bit Array & hash
    std::unordered_set<std::string> blacklist;  // Initialize blacklist
    std::string url = "example.com";  // create URL for test

    AddCommand cmd(&bloom, &blacklist, "blacklist_urls.txt", "bloomfilter_state.dat");  // Create AddCommand
    cmd.execute(url);  // Add URL using AddCommand

    EXPECT_TRUE(blacklist.find(url) != blacklist.end());  // Check URL was added to blacklist set

    BloomFilter loaded(256, { new IterativeStdHash(1) });  // Load BloomFilter from file
    loaded.loadFromFile("bloomfilter_state.dat");  // Load saved state
    EXPECT_TRUE(loaded.mightContain(url));  // make sure loaded BloomFilter contains the URL
}

// TEST 2
// this test checks that adding same URL twice doesnt duplicate in blacklist
TEST(add_same_url_twice, AddSameURL_Twice_ShouldNotDuplicate) {
    removeTestFiles();  
    BloomFilter bloom(256, { new IterativeStdHash(1) });  // initialize BloomFilter
    std::unordered_set<std::string> blacklist;  // create blacklist
    std::string url = "repeat.com";

    AddCommand cmd(&bloom, &blacklist, "blacklist_urls.txt", "bloomfilter_state.dat");  // create AddCommand
    cmd.execute(url);  // add once
    cmd.execute(url);  // add again

    std::ifstream file("blacklist_urls.txt");  // open blacklist file
    std::string line;
    int count = 0;
    while (std::getline(file, line)) {  // read each line
        if (line == url) count++;  // count occurrences
    }
    EXPECT_EQ(count, 1);  // should appear only once
}

// TEST 3
// Test that the added URL is actually written to the blacklist file on disk
TEST(added_url_written_to_file, AddedURL_WrittenToBlacklistFile) {
    removeTestFiles();  

    BloomFilter bloom(128, { new IterativeStdHash(1) });  // initialize BloomFilter with 128 bits and 1 hash
    std::unordered_set<std::string> blacklist;  // create empty blacklist
    std::string url = "www.example.com";  // define URL to be added

    AddCommand cmd(&bloom, &blacklist, "blacklist_urls.txt", "bloomfilter_state.dat");  // create an AddCommand instance with file paths
    cmd.execute(url);  // execute AddCommand to insert the URL into both Bloomfilter and blacklist

    std::ifstream file("blacklist_urls.txt");  // open blacklist for reading
    std::string line;  // hold each line read from the file
    bool found = false;  // flag to indicate if URL not found in the file

    while (std::getline(file, line)) {  // iterate over each line in the file
        if (line == url) {  // check if current line matches the URL
            found = true;  // mark as found
            break;  // exit the loop early
        }
    }

    EXPECT_TRUE(found);  // expect that URL was written to blacklist
}
