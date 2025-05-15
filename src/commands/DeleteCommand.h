#ifndef DELETECOMMAND_H
#define DELETECOMMAND_H

#include "ICommand.h"
#include "../BloomFilterLogic/BloomFilter.h"
#include <unordered_set>
#include <string>

// DeleteCommand removes URL from blacklist & update BloomFilter
class DeleteCommand : public ICommand {
private:
    BloomFilter* bloomFilter;  // pointer to shared BloomFilter
    std::unordered_set<std::string>* blacklist;  // pointer to blacklist
    const std::string blacklistFilePath = "../data/blacklist_urls.txt";  // path to blacklist file
    const std::string bloomFilePath = "../data/bloomfilter_state.dat";  // path to BloomFilter save file

public:
    // constructor: initializes DeleteCommand with access to BloomFilter & Blacklist
    // & file paths for BloomFilter & Blacklist
    DeleteCommand(BloomFilter* bloom, std::unordered_set<std::string>* bl,
                  const std::string& blFile, const std::string& bfFile);
    // deletes URL given as arg, removes URL from blacklist & update it
    // BloomFilter stays as is (might cause FP)
    CommandResult execute(const std::string& url) override;
};

#endif // DELETECOMMAND_H
