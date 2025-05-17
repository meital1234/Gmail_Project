#include "CheckCommand.h"
#include "CommandResult.h"
#include <fstream>
#include <iostream>

// Constructor: receives pointers to shared BloomFilter and blacklist structures
CheckCommand::CheckCommand(BloomFilter* bf, std::unordered_set<std::string>* bl)
    : bloomFilter(bf), blacklist(bl) {}

// This function executes the CheckCommand:
// It checks if the given URL exists in the Bloom Filter and/or the blacklist,
// and returns the logical result for server
CommandResult CheckCommand::execute(const std::string& url) {
    // empty input is BAD REQUEST
    if (url.empty()) {
        return CommandResult(StatusCode::BadRequest);
    }

    // checking bloomfilter & blacklist
    bool bloomMatch  = bloomFilter->mightContain(url);
    bool blackMatch  = blacklist->count(url) > 0;

    // deciding CODE STATUS: if not in bf -> BAD REQUEST | else its OK
    StatusCode code = StatusCode::OK;
     return CommandResult(code, bloomMatch, blackMatch);
}

