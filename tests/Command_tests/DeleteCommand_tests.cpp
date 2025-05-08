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

// Define a helper function to clean test output files
static void removeTestFiles() {
    std::remove("data/bloomfilter_state.dat");  // Remove saved BloomFilter
    std::remove("data/blacklist_urls.txt");     // Remove saved blacklist
}

// define a helper readFile() to read a file's entire content & return it as a single string
// helps to compare diffrences between file outputs
std::string readFile(const std::string& path) {
    std::ifstream file(path);  // open file at given path for reading
    std::stringstream buffer;  // create temporary string stream to gather file content
    buffer << file.rdbuf();  // read file buffer into the stream
    return buffer.str();  // return file content as a string
}

// TEST 1
// This test checks that a URL in blacklist is removed after DELETE
// and no longer exists in both in-memory set and blacklist file
TEST(DeleteCommand_FromIntegration, DeleteExistingURL_RemovesFromSetAndFile) {
    removeTestFiles();

    BloomFilter bloom(256, { new IterativeStdHash(1) });  // initialize BloomFilter
    std::unordered_set<std::string> blacklist = { "badsite.com" };  // insert URL into blacklist
    std::string url = "badsite.com";  // create URL for test

    // write URL to file manually - simulate existing state
    std::ofstream out("data/blacklist_urls.txt");  // open blacklist for writing (overwrite)
    out << url << "\n";  // write test URL to file, followed by /n


    DeleteCommand delCmd(&bloom, &blacklist, "data/blacklist_urls.txt", "data/bloomfilter_state.dat");
    delCmd.execute(url);  // executes DELETE

    EXPECT_EQ(blacklist.count(url), 0);  // URL should be removed from in-memory set

    std::string fileContent = readFile("data/blacklist_urls.txt");
    EXPECT_EQ(fileContent.find(url), std::string::npos);  // should be gone from file
}

// TEST 2
// This test checks that trying to delete a URL that doesn't exist in the blacklist
// doesn't crash and doesn't modify the blacklist file
        //TEST(delete_nonexistent_url, DeleteURL_NotInBlacklist_ShouldBeIgnored) {
        //    removeTestFiles();
        //
        //    BloomFilter bloom(256, { new IterativeStdHash(1) });  // create filter
        //    std::unordered_set<std::string> blacklist = { "existing.com" };  // insert different URL
        //    std::string url = "missing.com";  // create URL for test
        //
        //    // write existing.com to file
        //    std::ofstream out("data/blacklist_urls.txt");
        //    ASSERT_TRUE(out.is_open()) << "Failed to open blacklist file!"; //### changed. ###
        //    out << "existing.com\n";
        //
        //    DeleteCommand delCmd(&bloom, &blacklist, "data/blacklist_urls.txt", "data/bloomfilter_state.dat");
        //    delCmd.execute(url);  // Try to delete nonexistent URL
        //
        //    // Ensure original content remains
        //    std::string content = readFile("data/blacklist_urls.txt");  // read the blacklist into a string
        //    EXPECT_NE(content.find("existing.com"), std::string::npos);  // check that "existing.com" is still in file
        //    EXPECT_EQ(content.find("missing.com"), std::string::npos);  // check that "missing.com" wasnt added or altered in file
        //}
TEST(delete_nonexistent_url, DeleteURL_NotInBlacklist_ShouldBeIgnored) {
    removeTestFiles();

    CLIHandler handler;
    handler.loadOrInitializeBloomFilter("128 1");
    handler.registerCommands();

    handler.handleCommand("POST existing.com");        // נכניס אחד אמיתי
    handler.handleCommand("DELETE missing.com");       // ננסה למחוק משהו שלא קיים

    std::string content = readFile("data/blacklist_urls.txt");
    EXPECT_NE(content.find("existing.com"), std::string::npos);  // עדיין שם
    EXPECT_EQ(content.find("missing.com"), std::string::npos);   // לא הוסף בטעות
}
        

// TEST 3
// This test checks that calling DELETE on an empty input does nothing and prints error
        //TEST(delete_empty_input, Delete_EmptyInput_ShouldNotChangeAnything) {
        //    removeTestFiles();
        //
        //    BloomFilter bloom(128, { new IterativeStdHash(1) });  // create BloomFilter
        //    std::unordered_set<std::string> blacklist = { "someurl.com" };  // initial blacklist
        //    std::string url = "";  // create null URL for test
        //
        //    std::ofstream out("data/blacklist_urls.txt");
        //    ASSERT_TRUE(out.is_open()) << "Failed to open blacklist file!"; //### changed. ###
        //    out << "someurl.com\n"; // write URL to blacklist
        //
        //    DeleteCommand delCmd(&bloom, &blacklist, "data/blacklist_urls.txt", "data/bloomfilter_state.dat");
        //    delCmd.execute(url);  // try to delete with empty string
        //
        //    // ensure nothing was deleted
        //    EXPECT_EQ(blacklist.count("someurl.com"), 1);  // verify that "someurl.com" still exists in in-memory blacklist set
        //    std::string content = readFile("data/blacklist_urls.txt");  // read content of blacklist file into a string
        //    EXPECT_TRUE(content.find("someurl.com") != std::string::npos);  // Confirm that "someurl.com" still exists in blacklist
        //}
TEST(delete_empty_input, Delete_EmptyInput_ShouldNotChangeAnything) {
    removeTestFiles();

    CLIHandler handler;
    handler.loadOrInitializeBloomFilter("128 1");
    handler.registerCommands();

    handler.handleCommand("POST someurl.com");   // מכניס כמו שצריך
    handler.handleCommand("DELETE");             // פקודת מחיקה ריקה

    std::string content = readFile("data/blacklist_urls.txt");
    EXPECT_NE(content.find("someurl.com"), std::string::npos);  // עדיין שם
}
        
// TEST 4
// This test checks that BloomFilter is always saved after DELETE,
// even if the BloomFilter itself is not changed
TEST(delete_always_saves_bloomfilter, Delete_ShouldSaveBloomFileRegardless) {
    removeTestFiles();

    BloomFilter bloom(128, { new IterativeStdHash(1) });  // create a BloomFilter with 128 bits & 1 hash
    std::unordered_set<std::string> blacklist = { "delete.com" };  // initialize blacklist with 1 test URL
    bloom.add("delete.com");  // add same URL to BloomFilter

    std::ofstream out("data/blacklist_urls.txt");  // simulate existing blacklist
    out << "delete.com\n";  // write test URL to blacklist

    // create DeleteCommand with BloomFilter, blacklist, and file paths
    DeleteCommand delCmd(&bloom, &blacklist, "data/blacklist_urls.txt", "data/bloomfilter_state.dat");
    delCmd.execute("delete.com");  // executes DELETE on URL

    std::ifstream bloomFile("data/bloomfilter_state.dat");  // open BloomFilter save file
    EXPECT_TRUE(bloomFile.good());  // check that file exist after operation
}
