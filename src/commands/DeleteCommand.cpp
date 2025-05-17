#include "DeleteCommand.h"
#include "CommandResult.h"
#include <fstream>
#include <iostream> 

// constructor: receives pointers to BloomFilter and blacklist + file paths
DeleteCommand::DeleteCommand(BloomFilter* bf, std::unordered_set<std::string>* bl,
                             const std::string& blPath, const std::string& bfPath)
    : bloomFilter(bf), blacklist(bl), blacklistFilePath(blPath), bloomFilePath(bfPath) {}

    // initialize DeleteCommand with access to BloomFilter & blacklist
    // store file paths for later use when saving updated state

// execute DELETE of a URL from blacklist
CommandResult DeleteCommand::execute(const std::string& url) {
    // std::cout << "[DeleteCommand] DELETE " << url << std::endl;
    // empty input is BAD REQUEST
    if (url.empty()) {
       // std::cerr << "[DeleteCommand] Error: URL is empty" << std::endl;
        return CommandResult(StatusCode::BadRequest);
    }
    
    // check if URL exists in blacklist and of not thab NOT FOUND
    if (blacklist->count(url) == 0) {
        // std::cout << "[DeleteCommand] URL not found: " << url << std::endl;
        return CommandResult(StatusCode::NotFound);
    }
    
    blacklist->erase(url);  // remove URL from blacklist

    // if URL was deleted -> update blacklist file
    std::ofstream out(blacklistFilePath);  // open blacklist file for overwriting
    if (!out.is_open()) {
        // std::cerr << "[DeleteCommand] Error: cannot open blacklist file: "
                //   << blacklistFilePath << std::endl;
        return CommandResult(StatusCode::BadRequest);
    }
    for (const auto& item : *blacklist) {
        out << item << '\n';
    }

    // always save BloomFilter state to file & ensure it maintained, even if wasn't changed
    bloomFilter->saveToFile(bloomFilePath);  
    // std::cout << "[DeleteCommand] Successfully deleted URL and saved state: "
            //   << url << std::endl;

    return CommandResult(StatusCode::NoContent);  // NO CONTENT
}