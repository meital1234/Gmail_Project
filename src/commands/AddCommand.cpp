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
std::string AddCommand::execute(const std::string& url) {
    // skip if the input URL is empty
    if (url.empty()) return "false";  // 400 Bad Request

    // if already exists in blacklist, skip and notify as 'true'
    if (blacklist->count(url) > 0) return "true";  // URL already exists in blacklist
    
    bloomFilter->add(url);  // add to Bloom Filter
    blacklist->insert(url);  // add to in-memory blacklist

    // add URL to blacklist file
    std::ofstream outBlacklist(blacklistFilePath, std::ios::app);
    if (outBlacklist) outBlacklist << url << '\n';

    // save BloomFilter state to file
    bloomFilter->saveToFile(bloomFilePath);  

    return "true";  // URL added successfully
}
