#include "AddCommand.h"
#include "CommandResult.h" 
#include <fstream>
#include <iostream>

// constructor: receives pointers to shared BloomFilter and blacklist structures, and paths to data files
AddCommand::AddCommand(BloomFilter* bf, std::unordered_set<std::string>* bl, 
    const std::string& blFile, const std::string& bfFile)
    : bloomFilter(bf), blacklist(bl), blacklistFilePath(blFile), bloomFilePath(bfFile) {}

// execute POST command
CommandResult AddCommand::execute(const std::string& url) {
    // std::cout << "[AddCommand] POST " << url << std::endl;
    // empty input is BAD REQUEST
    if (url.empty()) {
        // std::cerr << "[AddCommand] Error: URL is empty" << std::endl;
        return CommandResult(StatusCode::BadRequest);
    }

    // if URL got ADDES to blacklist than its CREATED
    if (blacklist->count(url) > 0) {
        // std::cout << "[AddCommand] URL already in blacklist: " << url << std::endl;
        return CommandResult(StatusCode::Created);
    }

    // Add to in-memory structures
    bloomFilter->add(url);
    blacklist->insert(url);

    // Save blacklist to file
    std::ofstream out(blacklistFilePath);
    if (!out.is_open()) {
        // std::cerr << "[AddCommand] Error: cannot open blacklist file: "
                //   << blacklistFilePath << std::endl;
        return CommandResult(StatusCode::BadRequest);
    }
    for (auto &item : *blacklist) {
        out << item << '\n';
    }

    // Save bloom filter state to file
    bloomFilter->saveToFile(bloomFilePath);

    // std::cout << "[AddCommand] Successfully added URL and saved state." << std::endl;
    return CommandResult(StatusCode::Created);
}
