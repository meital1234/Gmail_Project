#include <set>
#include <unordered_set>
#include <iostream>
#include <sstream>
#include <fstream>
#include <regex>
#include "CLI_handler.h"
#include "../BloomFilterLogic/BloomFilter.h"
#include "../hash/IterativeStdHash.h"
#include "../commands/AddCommand.h"
#include "../commands/CheckCommand.h"
#include "../commands/DeleteCommand.h"

using namespace std;

// constructor that initializes bloomFilter to nullptr (waiting for config)
CLIHandler::CLIHandler() : bloomFilter(nullptr),
    blacklistFilePath("../data/blacklist_urls.txt"),
    bloomFilePath("../data/bloomfilter_state.dat") {}

//destructor
CLIHandler::~CLIHandler() {
    delete bloomFilter;
    // for each pair of string input (like "GET") & pointer to relevant command
    for (auto& pair : commandMap) {
        delete pair.second;
    }
}

// this function checks if their is a saved file of BloomFilter
// if yes it loads it and if no it initializes it according to configuration line
bool CLIHandler::loadOrInitializeBloomFilter(const std::string& configLine) {
    // Parse configuration line to initialize bloom filter
    // this "iss" is just like cin but enssure that what he reads from the config line is string
    std::istringstream iss(configLine);
    // defining variables for first two values in line: 
    // 1- size of the bit array, 2- number of hash functions
    int bitArraySize;
    // check that the first value exist and is positive integers
    if (!(iss >> bitArraySize) || bitArraySize <= 0) {
        // std::cout << "[CLIHandler] Invalid bit array size in config line." << std::endl;
        return false;  // 400 Bad Request
    }

      // hashType list represents types of hash funcs the user chose
    int hashType;
    std::vector<int> hashTypes;
    // this loop promise that hash type is valid (at least 1 exists & positive)
    while (iss >> hashType) {
        if (hashType <= 0) {
            // std::cout << "[CLIHandler] Invalid hash type in config line." << std::endl;
            return false;  // 400 Bad Request
        }
        hashTypes.push_back(hashType);
    }

    // ensure at least one hash function was provided
    if (hashTypes.empty()) {
        // std::cout << "[CLIHandler] No hash functions provided in config line." << std::endl;
        return false;  // 400 Bad Request
    }

    // initialize Bloom Filter
    std::vector<HashFunction*> hashFuncs = createHashFunctions(hashTypes);
    if (hashFuncs.empty()) {
        // std::cout << "[CLIHandler] Failed to create hash functions." << std::endl;
        return false;  // 400 Bad Request
    }

    bloomFilter = new BloomFilter(bitArraySize, hashFuncs);
    // std::cout << "[CLIHandler] New Bloom filter initialized." << std::endl;

    std::ifstream file(bloomFilePath, std::ios::binary);
    if (file.good()) {
        bloomFilter->loadFromFile(bloomFilePath);
        // std::cout << "[CLIHandler] Bloom filter state loaded from file." << std::endl;
    } else {
        // std::cout << "[CLIHandler] New Bloom filter initialized." << std::endl;
    }

    // Load blacklist regardless
    loadBlacklistFromFile();
    return true;
}

// registers command objects to their corresponding keywords
void CLIHandler::registerCommands() {
    // AddCommand will have access to bloomFilter & blacklist files
    // each command holds pointers to bloomFilter state & blacklist

    commandMap["POST"] = new AddCommand(bloomFilter, &blacklistUrls, blacklistFilePath, bloomFilePath);
    commandMap["GET"] = new CheckCommand(bloomFilter, &blacklistUrls);
    commandMap["DELETE"] = new DeleteCommand(bloomFilter, &blacklistUrls, blacklistFilePath, bloomFilePath);

    // std::cout << "[CLIHandler] Commands registered successfully." << std::endl;
}

// parses user line into command, validates format, and executes relevant command
CommandResult CLIHandler::handleCommand(const std::string& line) {
    // std::cout << "[CLIHandler] Received command line: \"" << line << "\"" << std::endl;

    // deviding each line to relevant tokens
    std::istringstream iss(line);
    std::string commandToken, urlToken, extraToken;

    // expects exactly two tokens: COMMAND URL (no extra)
    if (!(iss >> commandToken >> urlToken) || (iss >> extraToken)) {
        // std::cout << "[CLIHandler] Invalid command format: '" << line << "'" << std::endl;
        return CommandResult(StatusCode::BadRequest);
    }
 
    // check if command exists in map
    auto it = commandMap.find(commandToken);
    if (it == commandMap.end()) {
        // std::cout << "[CLIHandler] Unknown command: '" << commandToken << "'" << std::endl;
        return CommandResult(StatusCode::BadRequest);
    }

    // execute relevant command
    CommandResult result = it->second->execute(urlToken);

    return result;  // CommandResult for server status codes
}

// loads blacklist URLs from file into in-memory set
void CLIHandler::loadBlacklistFromFile() {
    std::ifstream in(blacklistFilePath);
    if (!in.is_open()) {
        // std::cerr << "[CLIHandler] Warning: Could not open blacklist file: " << blacklistFilePath << std::endl;
        return;
    }

    std::string url;
    while (getline(in, url)) {
        blacklistUrls.insert(url);
    }
    // std::cout << "[CLIHandler] Blacklist loaded: " << blacklistUrls.size() << " entries." << std::endl;
}

// saves blacklist URLs into file (overwrites existing)
void CLIHandler::saveBlacklistToFile() const {
    std::ofstream out(blacklistFilePath);
    if (!out.is_open()) {
        // std::cerr << "[CLIHandler] Error: Could not open blacklist file for writing: " << blacklistFilePath << std::endl;
        return;
    }

    for (const auto& url : blacklistUrls) {
        out << url << '\n';
    }
    // cout << "[CLIHandler] Blacklist saved to file: " << blacklistFilePath << endl;

}

// validates URL format using regex pattern
bool CLIHandler::isValidUrl(const std::string& url) {
    static const std::regex urlRegex(R"(^((https?:\/\/)?(www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z0-9]{2,})(\/\S*)?$)");
    return std::regex_match(url, urlRegex);
}

// creates hash functions according to user config types
std::vector<HashFunction*> CLIHandler::createHashFunctions(const std::vector<int>& ids) {
    std::vector<HashFunction*> funcs;
    for (int id : ids) {
        if (id > 0) {
            funcs.push_back(new IterativeStdHash(id)); 
        }
    }
    return funcs;
}
