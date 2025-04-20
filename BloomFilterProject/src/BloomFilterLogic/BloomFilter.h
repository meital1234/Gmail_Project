#pragma once

#include <string>
#include <vector>
#include <cstddef>    

using std::string;
using std::vector;
using std::size_t;

class HashFunction;

class BloomFilter {
private:
    size_t size;                         //stores the size of the bitArray
    vector<bool> bitArray;               //This is the array of bits — each bit represents whether a particular address has been added or not.
    vector<HashFunction*> hashFunctions; // Holds the list of hash functions that should be run on each URL.

    size_t getBitIndex(const string& str, HashFunction* hashFunc) const; //Accepts a string and a hash function, returns the corresponding position in the bitArray.
    //Why private: because it is only used from add and mightContain — there is no reason to expose it to the outside world
public:
    //constructor
    BloomFilter(size_t size, const std::vector<HashFunction*>& hashFunctions);//Determines the size of the array, Saves the hash functions

    // האם לעשות בנאי דיפולטיבי??
    
    void add(const string& url);//Adds an address to the filter — by running each hash function and changing the corresponding bits to true.
    bool mightContain(const string& url) const;//Checks if an address may be in the list. Returns false only if it is certain that it is not there.

    void saveToFile(const string& filename) const;//Saves the filter state to a file. This allows the state to be saved between runs.
    void loadFromFile(const string& filename);//Loads the bitArray state from a file, so you can continue working with the previous data.

};
