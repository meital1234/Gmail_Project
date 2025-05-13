#include "DeleteCommand.h"
#include <fstream>      
#include <iostream>     

// constructor: receives pointers to BloomFilter and blacklist + file paths
DeleteCommand::DeleteCommand(BloomFilter* bloom, std::unordered_set<std::string>* bl,
                             const std::string& blPath, const std::string& bfPath)
    : bloomFilter(bloom), blacklist(bl), blacklistFilePath(blPath), bloomFilePath(bfPath) {}
    // initialize DeleteCommand with access to BloomFilter & blacklist
    // store file paths for later use when saving updated state

// execute DELETE of a URL from blacklist
std::string DeleteCommand::execute(const std::string& url) {
    // empty input string is invalid so will be rejected & treated as Bad Request
    if (url.empty()) return "false";  // 400 Bad Request 
    
    // check if URL exists in blacklist
    if (blacklist->count(url) == 0) return "false";  // 404 Not Found
    
    blacklist->erase(url);  // remove URL from blacklist - 204 No Content

    // if URL was deleted -> update blacklist file
    std::ofstream out(blacklistFilePath);  // open blacklist file for overwriting
    if (out) {
    // Don't continue if file couldn't be opened
        for (const auto& item : *blacklist) {
            out << item << '\n';  // write remaining URLs to file
        }
    }
    
    // always save BloomFilter state to file & ensure it maintained, even if wasn't changed
    bloomFilter->saveToFile(bloomFilePath);  

    return "true";
}
