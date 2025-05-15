#pragma once

#ifndef CLI_HANDLER_H
#define CLI_HANDLER_H

#include <string>
#include <unordered_set>
#include <unordered_map>
#include "../commands/ICommand.h"
#include "../BloomFilterLogic/BloomFilter.h"

class CLIHandler {
private:
    // private function to check the validity of any given address - to see if it is really a url
    bool isValidUrl(const std::string& url);
    // Map between command names (like "ADD", "CHECK", "DELETE") and command objects
    std::unordered_map<std::string, ICommand*> commandMap;
    // Creates hash functions based on given IDs
    std::vector<HashFunction*> createHashFunctions(const std::vector<int>& ids);
    // Checks if the given URL is valid
    bool isConfigLine(const std::string& line);
    

public:
    CLIHandler(); 
    ~CLIHandler();
    // main function that runs the CLI infinite loop - all of user input goes through
    void run(); 
    // registers commands into the commandMap (during init)
    void registerCommands();
    // this function parses the input config line and determines the bit array size & the number of hash funcs
    bool loadOrInitializeBloomFilter(const std::string& configLine);
    // this function parses and execute user commands
    CommandResult handleCommand(const std::string& line, std::string& GEToutput);

    // this function saves the blacklist to a file
    void saveBlacklistToFile() const;
    // this function loads the blacklist from a file
    void loadBlacklistFromFile();
    // The BloomFilter object used for URL checks
    BloomFilter* bloomFilter = nullptr;
    // Directory path for data files
    const std::string dataDirPath = "../data/";
    // defualt file path that saves BloomFilter State
    const std::string bloomFilePath = "../data/bloomfilter.dat";
    // default path for blacklist file
    const std::string blacklistFilePath = "../data/blacklist_urls.txt";
    // stores all URLs that were actually added (for false positive verification)
    std::unordered_set<std::string> blacklistUrls;
};
#endif // CLI_HANDLER_H
