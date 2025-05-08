#include "CheckCommand.h"
#include <iostream>

// Constructor: receives pointers to shared BloomFilter and blacklist structures
CheckCommand::CheckCommand(BloomFilter* bf, std::unordered_set<std::string>* bl)
    : bloomFilter(bf), blacklist(bl) {}

// This function executes the CheckCommand:
// It checks if the given URL exists in the Bloom Filter and/or the blacklist,
// and prints the result to the standard output.
void CheckCommand::execute(const std::string& url) {
    // If the input URL is empty, print 'false' and return
    if (url.empty()) {
        std::cout << "false" << std::endl;
        return;
    }

    // Check if the URL might be in the Bloom Filter
    bool inBloom = bloomFilter->mightContain(url);

    // If not in Bloom Filter, it's definitely not present
    if (!inBloom) {
        std::cout << "false" << std::endl;
        return;
    }

    // Check if the URL is in the blacklist
    bool inBlacklist = blacklist->count(url) > 0;

    // Print the result based on presence in Bloom Filter and blacklist
    if (inBlacklist) {
        std::cout << "true true" << std::endl;  // Present in both
    } else {
        std::cout << "true false" << std::endl; // Present in Bloom Filter only (possible false positive)
    }
}
