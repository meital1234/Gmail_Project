#ifndef ADDCOMMAND_H
#define ADDCOMMAND_H

#include "ICommand.h"
#include "../BloomFilterLogic/BloomFilter.h"
#include <unordered_set>
#include <string>

// AddCommand handles adding URL to BloomFilter and blacklist.
class AddCommand : public ICommand {
private:
    BloomFilter* bloomFilter;  // pointer to bloomfilter
    std::unordered_set<std::string>* blacklist;  // pointer to blacklist
    const std::string blacklistFilePath = "../data/blacklist_urls.txt";  // path to blacklist file
    const std::string bloomFilePath = "../data/bloomfilter_state.dat"; // path to BloomFilter save file

public:
    // constructor creates AddCommand with access to BloomFilter & Blacklist
    AddCommand(BloomFilter* bloom, std::unordered_set<std::string>* bl,
               const std::string& blFile, const std::string& bfFile);

    // adds input URL to Bloom Filter & blacklist
    CommandResult execute(const std::string& url) override;
};

#endif // ADDCOMMAND_H
