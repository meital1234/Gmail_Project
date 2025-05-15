#include "AddCommand.h"
#include <fstream>
#include <iostream>

// constructor: receives pointers to shared BloomFilter and blacklist structures, and paths to data files
AddCommand::AddCommand(BloomFilter* bf, std::unordered_set<std::string>* bl, 
    const std::string& blFile, const std::string& bfFile)
    : bloomFilter(bf), blacklist(bl), blacklistFilePath(blFile), bloomFilePath(bfFile) {}

// execute POST command
CommandResult AddCommand::execute(const std::string& url) {
    std::cout << "[AddCommand] Received POST command for URL: " << url << std::endl;

    if (url.empty()) {
        std::cerr << "[AddCommand] Error: URL is empty" << std::endl;
        return { false, false, "" };  // 400 Bad Request
    }

    if (blacklist->count(url) > 0) {
        std::cout << "[AddCommand] URL already exists in blacklist: " << url << std::endl;
        return { true, false, "" };  // Already exists (but still success for POST)
    }

    // Add to in-memory structures
    bloomFilter->add(url);
    blacklist->insert(url);

    // Save blacklist to file
    std::ofstream out(blacklistFilePath);
    if (!out.is_open()) {
        std::cerr << "[AddCommand] Error: Could not open file for writing: " << blacklistFilePath << std::endl;
        return { false, false, "" };  // 400 Bad Request due to file error
    }

    for (const auto& item : *blacklist) {
        out << item << '\n';
    }

    // Save bloom filter state to file
    bloomFilter->saveToFile(bloomFilePath);

    std::cout << "[AddCommand] Successfully added URL to blacklist and saved state." << std::endl;

    return { true, false, "" };  // Successful POST => Server returns 201 Created
}



// #include "AddCommand.h"
// #include <fstream>
// #include <iostream>
// 
// // constructor: receives pointers to shared BloomFilter and blacklist structures, and paths to data files
// AddCommand::AddCommand(BloomFilter* bf, std::unordered_set<std::string>* bl,
//                        const std::string& blPath, const std::string& bfPath)
//     : bloomFilter(bf), blacklist(bl), blacklistFilePath(blPath), bloomFilePath(bfPath) {}
// 
// // this function executes AddCommand:
// // it adds the given URL to both the Bloom Filter and the blacklist,
// // and saves both structures to their corresponding files.
// CommandResult AddCommand::execute(const std::string& url) {
//   // skip if the input URL is empty
//   if (url.empty()) return { false, false, "" };  // 400 Bad Request
// 
//   // if already exists in blacklist, skip and notify as 'true'
//   if (blacklist->count(url) > 0) return { true, false, "" };  // URL already exists in blacklist
//     
//   bloomFilter->add(url);  // add to Bloom Filter
//   blacklist->insert(url);  // add to in-memory blacklist
// 
//   // add URL to blacklist file
//   std::ofstream out(blacklistFilePath);
//   if (!out.is_open()) {
//     std::cerr << "[AddCommand] Error: Could not open blacklist file for writing: " << blacklistFilePath << std::endl;
//     return { false, false, "" };  // treat as Bad Request
//   }
// 
//   for (const auto& item : *blacklist) out << item << '\n';
//   // save BloomFilter state to file
//   bloomFilter->saveToFile(bloomFilePath); 
//   
//   return { true, false, "" };
// }
