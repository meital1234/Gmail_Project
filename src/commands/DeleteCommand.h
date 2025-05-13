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
    std::string blacklistFilePath;  // path to blacklist file
    std::string bloomFilePath;  // path to BloomFilter save file

public:
    // constructor: initializes DeleteCommand with access to BloomFilter & Blacklist
    // & file paths for BloomFilter & Blacklist
    DeleteCommand(BloomFilter* bf, std::unordered_set<std::string>* bl,
                  const std::string& blPath, const std::string& bfPath);
    // deletes URL given as arg, removes URL from blacklist & update it
    // BloomFilter stays as is (might cause FP)
    std::string execute(const std::string& url) override;
};

#endif // DELETECOMMAND_H
