// Test 1 - URL in blacklist should be removed from memory & file
// Test 2 - URL not in blacklist should be ignored and file unchanged
// Test 3 - Empty input string should be rejected and have no effect
// Test 4 - BloomFilter file should be saved after DELETE regardless

#include "commands/DeleteCommand.h"
#include "hash/IterativeStdHash.h"
#include "BloomFilterLogic/BloomFilter.h"
#include "CLIhandler/CLI_handler.h"
#include <gtest/gtest.h>
#include <unordered_set>
#include <fstream>
#include <sstream>
#include <cstdio>

// helper function to clean test output files

static void removeTestFiles() {
    std::remove("../data/bloomfilter_state.dat");
    std::remove("../data/blacklist_urls.txt");
}

// TEST 1 – Deleting an existing URL returns 204 No Content and removes it from memory & file
TEST(DeleteCommandTests, DeleteExistingURL_RemovesFromSetAndFile) {
    removeTestFiles();

    BloomFilter bloom(256, { new IterativeStdHash(1) });
    std::unordered_set<std::string> blacklist = { "badsite.com" };

    // Prepopulate the file
    {
        std::ofstream out("../data/blacklist_urls.txt");
        out << "badsite.com\n";
    }

    DeleteCommand cmd(&bloom, &blacklist, "../data/blacklist_urls.txt", "../data/bloomfilter_state.dat");

    CommandResult res = cmd.execute("badsite.com");
    EXPECT_EQ(res.statusCode, StatusCode::NoContent);

    // In-memory set must no longer contain it
    EXPECT_EQ(blacklist.count("badsite.com"), 0);

    // File must not contain it either
    std::ifstream in("../data/blacklist_urls.txt");
    std::string content;
    std::stringstream buf;
    buf << in.rdbuf();
    EXPECT_EQ(buf.str().find("badsite.com"), std::string::npos);
}

// TEST 2 – Deleting a non-existent URL returns 404 Not Found and leaves file untouched
TEST(DeleteCommandTests, DeleteURL_NotInBlacklist_ShouldReturnNotFound) {
    removeTestFiles();

    BloomFilter bloom(256, { new IterativeStdHash(1) });
    std::unordered_set<std::string> blacklist = { "keep.com" };

    // write only "keep.com" to file
    {
        std::ofstream out("../data/blacklist_urls.txt");
        out << "keep.com\n";
    }

    DeleteCommand cmd(&bloom, &blacklist, "../data/blacklist_urls.txt", "../data/bloomfilter_state.dat");
    CommandResult res = cmd.execute("missing.com");
    EXPECT_EQ(res.statusCode, StatusCode::NotFound);

    // File still contains "keep.com" but not "missing.com"
    std::ifstream in("../data/blacklist_urls.txt");
    std::string fileText((std::istreambuf_iterator<char>(in)), std::istreambuf_iterator<char>());
    EXPECT_NE(fileText.find("keep.com"), std::string::npos);
    EXPECT_EQ(fileText.find("missing.com"), std::string::npos);
}

// TEST 3 – Empty input to DELETE → 400 Bad Request, no changes
TEST(DeleteCommandTests, Delete_EmptyInput_ShouldReturnBadRequest) {
    removeTestFiles();

    BloomFilter bloom(256, { new IterativeStdHash(1) });
    std::unordered_set<std::string> blacklist = { "keep.com" };
    {
        std::ofstream out("../data/blacklist_urls.txt");
        out << "keep.com\n";
    }

    DeleteCommand cmd(&bloom, &blacklist, "../data/blacklist_urls.txt", "../data/bloomfilter_state.dat");
    CommandResult res = cmd.execute("");
    EXPECT_EQ(res.statusCode, StatusCode::BadRequest);

    // Ensure file unchanged
    std::ifstream in("../data/blacklist_urls.txt");
    std::string fileText((std::istreambuf_iterator<char>(in)), std::istreambuf_iterator<char>());
    EXPECT_NE(fileText.find("keep.com"), std::string::npos);
}

// TEST 4 – DELETE always writes BloomFilter state to disk
TEST(DeleteCommandTests, Delete_ShouldSaveBloomFileRegardless) {
    removeTestFiles();

    BloomFilter bloom(128, { new IterativeStdHash(1) });
    std::unordered_set<std::string> blacklist = { "delete.com" };
    bloom.add("delete.com");

    // prepopulate blacklist file
    {
        std::ofstream out("../data/blacklist_urls.txt");
        out << "delete.com\n";
    }

    DeleteCommand cmd(&bloom, &blacklist, "../data/blacklist_urls.txt", "../data/bloomfilter_state.dat");
    CommandResult res = cmd.execute("delete.com");
    EXPECT_EQ(res.statusCode, StatusCode::NoContent);

    // BloomFilter state file must exist
    std::ifstream bf("../data/bloomfilter_state.dat");
    EXPECT_TRUE(bf.good());
}