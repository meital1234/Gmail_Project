#include "CheckCommand.h"

// Constructor: receives pointers to shared BloomFilter and blacklist structures
CheckCommand::CheckCommand(BloomFilter* bf, std::unordered_set<std::string>* bl)
    : bloomFilter(bf), blacklist(bl) {}

// This function executes the CheckCommand:
// It checks if the given URL exists in the Bloom Filter and/or the blacklist,
// and returns the logical result for server
std::string CheckCommand::execute(const std::string& url) {

    if (url.empty()) {
        return "";
    }

    bool inBloom = bloomFilter->mightContain(url);
    if(!inBloom) {
        return "false";
    }
    

    bool inBlacklist = blacklist->count(url) > 0;

     if (inBlacklist) {
        return "true true";
    } else {
        return "true false";
    }
}
