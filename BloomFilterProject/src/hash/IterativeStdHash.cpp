#include "IterativeStdHash.h"
#include <functional>

// standard constructor implementation - initialize the number of iterations with the given n
IterativeStdHash::IterativeStdHash(size_t n) : iterations(n) {}

// operator overloading - I want to be able to call iterativeStdHash(some_string), so I need to override the operator "()"
size_t IterativeStdHash::operator()(const std::string& input) const {
    // initialize a standard std hash object
    std::hash<std::string> stdHasher;
    std::string current = input;
    size_t result = 0;

    // loop the number of iterations, each time hashing the last loop result
    for (size_t i = 0; i < iterations; ++i) {
        result = stdHasher(current);
        current = std::to_string(result);
    }

    return result;
}

std::string IterativeStdHash::getName() const {
    return "iterative_std::hash_" + std::to_string(iterations);
}
