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
    //// registers commands into the commandMap (during init)
    //void registerCommands();

public:
    // registers commands into the commandMap (during init)
    void registerCommands();
    // constructor that will initialize reference variables if needed 
    CLIHandler();
    // main function that runs the CLI infinite loop - all of user input goes through
    void run();
    BloomFilter* bloomFilter = nullptr;
    // defualt file path that saves BloomFilter State
    const std::string bloomFilePath = "data/bloomfilter_state.dat";

    // Stores all URLs that were actually added (for false positive verification)
    std::unordered_set<std::string> blacklistUrls;
    const std::string blacklistFilePath = "data/blacklist_urls.txt";
    // this function parses the input config line and determines the bit array size & the number of hash funcs
    bool loadOrInitializeBloomFilter(const std::string& configLine);
    // this function parses and execute user commands
    bool handleCommand(const std::string& line);
    // this function saves the blacklist to a file
    void saveBlacklistToFile() const;
    // this function loads the blacklist from a file
    void loadBlacklistFromFile();
    // this function prints true or false according to result
    void printOutput(bool firstResult, bool secondResult = false);
    // this function checks if input is valid
    bool isLineValidFormat(const std::string& line);
};
#endif // CLI_HANDLER_H
