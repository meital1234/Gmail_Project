#include "BloomFilter.h"
#include <fstream>
#include <vector>
#include <string>
// #include "HashFunction.h"
#include "../hash/HashFunction.h"
#include <stdexcept>


//using namespace std;
using std::ofstream;
using std::ifstream;
using std::ios;
using std::string;
using std::size_t;
using std::vector;

//constructor
BloomFilter::BloomFilter(size_t size, const vector<HashFunction*>& hashFunctions)
    : size(size), bitArray(size, false), hashFunctions(hashFunctions) {
    if (size == 0) {
        throw std::invalid_argument("BloomFilter size must be greater than 0");
    }
}

/** initializes:
this->size – the size of the filter
bitArray(size, false) – an array initialize to 0 of length size
hashFunctions – simply stores what we got **/

// private helper - calculates bit index
size_t BloomFilter::getBitIndex(const string& str, HashFunction* hashFunc) const {
    return (*hashFunc)(str) % size;
   //... % size — because your bit array is of size, so accessing an out-of-bounds index is not allowed.
}

// add string to bloom filter
void BloomFilter::add(const string& url) {
    for (HashFunction* func : hashFunctions) { //Runs on all hash functions.
        int index = getBitIndex(url, func); //Runs all hash functions on the URL.
        bitArray[index] = true; //Each hash returns an index, and the corresponding bit is turned on.
    }
}

// check if string might be in filter
bool BloomFilter::mightContain(const string& url) const {
    for (HashFunction* func : hashFunctions) { //Runs on all hash functions.
        int index = getBitIndex(url, func); //Runs all hash functions on the URL.
        if (!bitArray[index]) //If one of the bits is off, it definitely doesn't exist.
            return false;
    }
    return true; //If everything is on, it may be a false positive.(but we will return true for now' and check with the url's list)
}

// save current bitArray to a file
void BloomFilter::saveToFile(const string& filename) const { //Accepts a string – the name of the file we will save in.
    // The const at the end means: it does not change the object (it only reads data, does not change it).

    /*Creates an object named outFile of type ofstream (abbreviation for Output File Stream).
    It is used to write to a file.
    filename – This is the name of the file.
    ios::binary – Opens the file in binary mode,
    meaning it saves the information as it is in memory (not readable text, but zeros and ones). */
    ofstream outFile(filename, ios::binary);
    if (!outFile) throw std::runtime_error("Failed to open file for writing");
    //Checks if an error occurred while opening the file. If we were unable to open – we simply exit the function.
    if (!outFile.is_open()) {
        return;
    }

    // Save filter size as metadata (optional but recommended)
    outFile.write(reinterpret_cast<const char*>(&size), sizeof(size));

    for (bool bit : bitArray) { //loop that goes through all the bits in a bitArray.
        char c = bit ? 1 : 0; //If bit == true, then c = 1. If bit == false, then c = 0.
        outFile.write(&c, sizeof(char)); //This is how a 0 or 1 is written to a file — bit by bit, exactly as it appears in the bitArray.
    }

    outFile.close();
}

// load bitArray from file
void BloomFilter::loadFromFile(const string& filename) { //Opens the file for reading and reads in binary form
    ifstream inFile(filename, ios::binary);
    if (!inFile) throw std::runtime_error("Failed to open file for reading");
    if (!inFile.is_open()) {
        return; //If we were unable to open – we simply exit the function.
    }

    //This loop reads the bits we previously saved in the file one by one, and restores them into the filter's bitArray.
    for (int i = 0; i < size && inFile.good(); ++i) { //inFile.good() is a safety condition – it checks if the read file (inFile) is still in good condition.
        char c = 0; //A temporary variable to read a byte into from the file.
        inFile.read(&c, sizeof(c)); //Reads one byte from the file into the variable c.
        bitArray[i] = (c != 0); //bitArray accepts a boolean value, that is why we write (c!=0)
    }
    
    inFile.close();
}