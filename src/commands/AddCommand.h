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
    std::string blacklistFilePath;  // path to blacklist file
    std::string bloomFilePath;  // path to BloomFilter save file

public:
    // constructor creates AddCommand with access to BloomFilter & Blacklist
    AddCommand(BloomFilter* bf, std::unordered_set<std::string>* bl,
               const std::string& blPath, const std::string& bfPath);

    // adds input URL to Bloom Filter & blacklist
    void execute(const std::string& argument) override;
};

#endif // ADDCOMMAND_H
