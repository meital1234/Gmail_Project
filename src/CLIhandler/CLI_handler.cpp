#include <set>
#include <iostream>
#include <sstream>
#include <fstream>
#include "CLI_handler.h"
#include "../BloomFilterLogic/BloomFilter.h"
#include "../hash/IterativeStdHash.h"
#include <regex>


using namespace std;

CLIHandler::CLIHandler() {
// everything happens in run()
}

void CLIHandler::run() {
    std::string user_line;
    bool initialized = false;
    // waits to get line after line from user
    while (getline(std::cin, user_line)) {
         // if the line is configuration line (like 256 2 1) it will load into BloomFilter
         if (!initialized) {
            if (loadOrInitializeBloomFilter(user_line)) {
                initialized = true;
            } else {
                // std::cout << "Invalid configuration line, try again." << std::endl;
                continue;
            }
        } else {
            handleCommand(user_line);
        }
    }

    delete bloomFilter;
}

std::vector<HashFunction*> createHashFunctions(const std::vector<int>& ids) {
    std::vector<HashFunction*> funcs;
    bool hasValid = false;

    for (int id : ids) {
        // changed logic so that any positive number could be accepted as the number of iterations
        if (id > 0) {
            funcs.push_back(new IterativeStdHash(id)); 
            hasValid = true;
        }
        // if (id == 1) {
        //     funcs.push_back(new IterativeStdHash(1));
        //     hasValid = true;
        // } else if (id == 2) {
        //     funcs.push_back(new IterativeStdHash(2));
        //     hasValid = true;
        // } else {
        //     // cerr << "Unknown hash function ID: " << id << std::endl;
        // }
    }

    if (!hasValid) {
        funcs.clear();
    }

    return funcs;
}

// this function checks if their is a saved file of BloomFilter
// if yes it loads it and if no it initializes it according to configuration line
bool CLIHandler::loadOrInitializeBloomFilter(const std::string& configLine) {
    
        // Parse configuration line to initialize bloom filter
        // this "iss" is just like cin but enssure that what he reads from the config line is string
        istringstream iss(configLine);
        // defining variables for first two values in line: 
        // 1- size of the bit array, 2- number of hash functions
        int bitArraySize;
        // check that the first value exist and is positive integers
        if (!(iss >> bitArraySize) || bitArraySize <= 0 ) {
            // std::cerr << "Invalid configuration: first value must be a positive integer (bit array size)." << endl;
            return false;
        }
        // list of identifiers of hash functions that the user chose
        // hashType list representing the types of hash funcs the user chose
        int hashType;
        std::vector<int> hashTypes;
        // this loop promise that hash type is valid
        while (iss >> hashType) {
            if (hashType <= 0) {
                // std::cerr << "Invalid configuration: hash function identifiers must be positive integers." << endl;
                return false;
            }
            hashTypes.push_back(hashType);
        }
        // ensure at least one hash function was provided
        if (hashTypes.empty()) {
            // std::cerr << "Invalid configuration: at least one hash function must be specified." << endl;
            return false;
        }

        // initialize Bloom Filter
        std::vector<HashFunction*> hashFuncs = createHashFunctions(hashTypes);
        if (hashFuncs.empty()) {
            // std::cerr << "Configuration failed: No valid hash functions provided." << std::endl;
            return false;
        }

        // opening file for reading and if its good (exists & open) 
        // load saved bloomfilter state and replace current object
                //ifstream file(bloomFilePath);
        //if (file.good()&& configLine.empty()) {
        //    bloomFilter = new BloomFilter(bitArraySize, hashFuncs); 
        //    bloomFilter->loadFromFile(bloomFilePath);
        //} 
        //else {
        //    bloomFilter = new BloomFilter(bitArraySize, hashFuncs);
        bloomFilter = new BloomFilter(bitArraySize, hashFuncs);
        ifstream file(bloomFilePath);
        if (file.good()) {
        bloomFilter->loadFromFile(bloomFilePath);
    }


    
    // Load blacklist regardless
    loadBlacklistFromFile();
    return true;
}

// Loads URLs from the blacklist file into memory (blacklistUrls)
// enables verifying URLs detect false positives.
void CLIHandler::loadBlacklistFromFile() {
    // Open the input file for reading
    ifstream in(blacklistFilePath);
    // If the file doesnt exist or can't be read, do nothing
    if (!in) return;

    string url;
    // Read each line (URL) and insert it into the in-memory blacklist
    while (getline(in, url)) {
        blacklistUrls.insert(url);
    }
}

bool CLIHandler::isValidUrl(const std::string& url) {
    static const std::regex urlRegex(R"(^((https?:\/\/)?(www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z0-9]{2,})(\/\S*)?$)");
    return std::regex_match(url, urlRegex);
}

// this function sperates the input string from user
// devide it to tokens and ensures valid format (exactly two tokens)
void CLIHandler::handleCommand(const std::string& line) {
    istringstream iss(line);
    string commandToken, urlToken, extraToken;
    // Check if line has exactly two tokens
    if (!(iss >> commandToken >> urlToken) || (iss >> extraToken)) {
        // if the format is invalid - skip line
        return;
    }
    // check if command is 1 - add to blacklist or 2 - check if in blacklist 
    if (commandToken == "1") {
        if (!isValidUrl(urlToken)) return; // Skip invalid URL
        processAdd(urlToken);
    } 
    else if (commandToken == "2") {
        processCheck(urlToken);
    } 
    else {
        return;
    }
}

// when user command 1 this function adds the URL to the Bloom Filter
// and verified blacklist, and saves both to disk.
void CLIHandler::processAdd(const std::string& url) {
    // add to Bloom Filter
    bloomFilter->add(url);
    // add to in-memory blacklist
    blacklistUrls.insert(url);
    // save updated blacklist to file
    saveBlacklistToFile();
    // save updated Bloom Filter state to file
    bloomFilter->saveToFile(bloomFilePath);
}

// this function saves the entire blacklist to the blacklist files
// overwrites the file with the current contents of blacklistUrls.
void CLIHandler::saveBlacklistToFile() const {
    // Open the output file (overwrites existing content)
    ofstream out(blacklistFilePath);
    if (!out) {
    // if file cannot be open, exit
        return;
    }
    // Write each URL to a new line in the file
    for (const string& url : blacklistUrls) {
        out << url << '\n';
    }
}

// when user command 2 this function checks if the URL is in bloom filter
// detect false-positives and prints them
void CLIHandler::processCheck(const std::string& url) {
    // check using  Bloom Filter
    bool possiblyExists = bloomFilter->mightContain(url);
    // if Bloom Filter says no than not in blacklist
    if (!possiblyExists) {
        printOutput(false);
        return;
    }
    // otherwise, check the verified blacklist (to detect false positives)
    bool Exists = blacklistUrls.find(url) != blacklistUrls.end();
    // print output showing Bloom result + real result
    printOutput(true, Exists);
}

// this function prints the result of a Bloom Filter and blacklist check
void CLIHandler::printOutput(bool firstResult, bool secondResult) {
    // if bloom filter says URL not in set, print false
    if (!firstResult) {
        cout << "false" << endl;
    } 
    // else prints "true true" or "true false" depending
    else {
        cout << "true " << (secondResult ? "true" : "false") << endl;
    }
}
