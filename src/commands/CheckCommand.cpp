#include "CheckCommand.h"

// Constructor: receives pointers to shared BloomFilter and blacklist structures
CheckCommand::CheckCommand(BloomFilter* bf, std::unordered_set<std::string>* bl)
    : bloomFilter(bf), blacklist(bl) {}

// This function executes the CheckCommand:
// It checks if the given URL exists in the Bloom Filter and/or the blacklist,
// and returns the logical result for server
CommandResult CheckCommand::execute(const std::string& url) {
    if (url.empty()) return { false, false, "" };  // Invalid input

    bool inBloom = bloomFilter->mightContain(url);
    if (!inBloom) return { true, false, "false" };  // not in bloom filter

    bool inBlacklist = blacklist->count(url) > 0;
    return { true, false, inBlacklist ? "true true" : "true false" };
}
