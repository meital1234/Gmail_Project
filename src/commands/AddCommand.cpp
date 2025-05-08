#include "AddCommand.h"
#include <fstream>
#include <iostream>

// constructor: receives pointers to shared BloomFilter and blacklist structures, and paths to data files
AddCommand::AddCommand(BloomFilter* bloom, std::unordered_set<std::string>* blacklist,
                       const std::string& blacklistFile, const std::string& bloomFile)
    : bloomFilter(bloom), blacklist(blacklist),
      blacklistFilePath(blacklistFile), bloomFilePath(bloomFile) {}

// this function executes AddCommand:
// it adds the given URL to both the Bloom Filter and the blacklist,
// and saves both structures to their corresponding files.
void AddCommand::execute(const std::string& url) {
    // skip if the input URL is empty
    if (url.empty()) {
        std::cerr << "ERROR: Empty URL cannot be added." << std::endl;
        return;
    }

    // if already in blacklist, skip and notify
    if (blacklist->count(url) > 0) {
        std::cout << "URL already in blacklist." << std::endl;
        return;
    }

    bloomFilter->add(url);  // add to Bloom Filter
    blacklist->insert(url);  // add to in-memory blacklist

    // add URL to blacklist file
    std::ofstream outBlacklist(blacklistFilePath, std::ios::app);
    if (outBlacklist) {
        outBlacklist << url << '\n';
    }

    // save BloomFilter state to file
    bloomFilter->saveToFile(bloomFilePath);

    std::cout << "URL added successfully." << std::endl;
}
