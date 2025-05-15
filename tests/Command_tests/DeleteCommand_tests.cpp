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

static void removeTestFiles() {
    std::remove("../data/bloomfilter_state.dat");
    std::remove("../data/blacklist_urls.txt");
}

std::string readFile(const std::string& path) {
    std::ifstream file(path);
    std::stringstream buffer;
    buffer << file.rdbuf();
    return buffer.str();
}

TEST(DeleteCommand_FromIntegration, DeleteExistingURL_RemovesFromSetAndFile) {
    removeTestFiles();

    BloomFilter bloom(256, { new IterativeStdHash(1) });
    std::unordered_set<std::string> blacklist = { "badsite.com" };
    std::string url = "badsite.com";

    std::ofstream out("../data/blacklist_urls.txt");
    out << url << "\n";

    DeleteCommand delCmd(&bloom, &blacklist, "../data/blacklist_urls.txt", "../data/bloomfilter_state.dat");
    delCmd.execute(url);

    EXPECT_EQ(blacklist.count(url), 0);

    std::string fileContent = readFile("../data/blacklist_urls.txt");
    EXPECT_EQ(fileContent.find(url), std::string::npos);
}

TEST(delete_nonexistent_url, DeleteURL_NotInBlacklist_ShouldBeIgnored) {
    removeTestFiles();

    CLIHandler handler;
    handler.loadOrInitializeBloomFilter("128 1");
    handler.registerCommands();

    std::string dummyOutput;
    handler.handleCommand("POST existing.com", dummyOutput);
    handler.handleCommand("DELETE missing.com", dummyOutput);

    std::string content = readFile("../data/blacklist_urls.txt");
    EXPECT_NE(content.find("existing.com"), std::string::npos);
    EXPECT_EQ(content.find("missing.com"), std::string::npos);
}

TEST(delete_empty_input, Delete_EmptyInput_ShouldNotChangeAnything) {
    removeTestFiles();

    CLIHandler handler;
    handler.loadOrInitializeBloomFilter("128 1");
    handler.registerCommands();

    std::string dummyOutput;
    handler.handleCommand("POST someurl.com", dummyOutput);
    handler.handleCommand("DELETE", dummyOutput);

    std::string content = readFile("../data/blacklist_urls.txt");
    EXPECT_NE(content.find("someurl.com"), std::string::npos);
}

TEST(delete_always_saves_bloomfilter, Delete_ShouldSaveBloomFileRegardless) {
    removeTestFiles();

    BloomFilter bloom(128, { new IterativeStdHash(1) });
    std::unordered_set<std::string> blacklist = { "delete.com" };
    bloom.add("delete.com");

    std::ofstream out("../data/blacklist_urls.txt");
    out << "delete.com\n";

    DeleteCommand delCmd(&bloom, &blacklist, "../data/blacklist_urls.txt", "../data/bloomfilter_state.dat");
    delCmd.execute("delete.com");

    std::ifstream bloomFile("../data/bloomfilter_state.dat");
    EXPECT_TRUE(bloomFile.good());
}
