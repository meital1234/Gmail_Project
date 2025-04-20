#pragma once

#ifndef CLI_HANDLER_H
#define CLI_HANDLER_H

#include <string>
#include <set>
#include "../BloomFilterLogic/BloomFilter.h"

class CLIHandler {
public:
    // constructor that will initialize reference variables if needed 
    CLIHandler();
    // main function that runs the CLI infinite loop - all of user input goes through
    void run();
    
// private:
    BloomFilter* bloomFilter = nullptr;
    // defualt file path that saves BloomFilter State
    const std::string bloomFilePath = "data/bloomfilter_state.dat";

    // Stores all URLs that were actually added (for false positive verification)
    std::set <std::string> blacklistUrls;
    const std::string blacklistFilePath = "data/blacklist_urls.txt";


    // this function handles the starting line of input and determines the bit array size and the number of hash funcs
    void loadOrInitializeBloomFilter(const std::string& configLine);
    // this function analyzes command line (adding or checking)
    void handleCommand(const std::string& line);
    // this function adds URL to bloomfilter
    void processAdd(const std::string& url);
    // Saves the blacklist to a file
    void saveBlacklistToFile() const;
    // this function checks if URL is in bloomfilter
    void processCheck(const std::string& url);
    // Loads the blacklist from a file
    void loadBlacklistFromFile();
    // this function prints true or false according to result
    void printOutput(bool firstResult, bool secondResult = false);
    // this function checks if input is valid
    bool isLineValidFormat(const std::string& line);
};
#endif // CLI_HANDLER_H
