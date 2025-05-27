#pragma once
#include <string>

// virtual hashFunction interface, all different hash functions should inherit from this interface
class HashFunction {
public:
    virtual ~HashFunction() = default;

    // Main function: take a string, return a number
    virtual size_t operator()(const std::string& input) const = 0;

    // name of the hash function
    virtual std::string getName() const = 0;
};
