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
void DeleteCommand::execute(const std::string& url) {
    // we want to reject empty input string
    if (url.empty()) {
        std::cerr << "ERROR: Cannot delete an empty URL." << std::endl;  // print error to stderr
        return;
    }

    bool changed = false;

        // check if URL exists in blacklist
        if (blacklist->count(url) == 0) { 
            std::cout << "URL not found in blacklist." << std::endl;  // if URL not found we do nothing
         } else {
            blacklist->erase(url);  // remove URL from blacklist
            std::cout << "URL deleted from blacklist." << std::endl;  // confirm DELETE to user
            changed = true;
        }
    

            // if URL was deleted -> update blacklist file
            //if (changed) {
            //std::ofstream out(blacklistFilePath);  // open blacklist file for overwriting
            //for (const auto& item : *blacklist) {
            //    out << item << '\n';  // write remaining URL to file
            //}
        // if URL was deleted -> update blacklist file
    if (changed) {
        std::ofstream out(blacklistFilePath);  // open blacklist file for overwriting
        if (!out) {
            std::cerr << "ERROR: Failed to open blacklist file: " << blacklistFilePath << std::endl;
            return;  // Don't continue if file couldn't be opened
        }

        for (const auto& item : *blacklist) {
            out << item << '\n';  // write remaining URLs to file
        }
    }
    
    // always save BloomFilter state to file, even if Bloom wasn't changed
    bloomFilter->saveToFile(bloomFilePath);  // ensure BloomFilter state is maintained
}
