#ifndef CHECKCOMMAND_H
#define CHECKCOMMAND_H

#include "ICommand.h"
#include "../BloomFilterLogic/BloomFilter.h"
#include <unordered_set>
#include <string>

// CheckCommand verifies if URL is in BloomFilter & checks if it's a false positive using the blacklist
class CheckCommand : public ICommand {
private:
    BloomFilter* bloomFilter;  // Pointer to BloomFilter instance
    std::unordered_set<std::string>* blacklist;  // Pointer to verified blacklist

public:
    // Constructor creates CheckCommand with access to BloomFilter & blacklist
    CheckCommand(BloomFilter* bf, std::unordered_set<std::string>* bl); 

    // Checks if input URL might be in the BloomFilter and checks with blacklist
    // and returns logical result (true or false) for server to handle
    // std::string executeCheck(const std::string& url);
    CommandResult execute(const std::string& url) override;
};

#endif // CHECKCOMMAND_H
