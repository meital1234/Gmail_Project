#include "gtest/gtest.h"
#include <vector>
#include <string>
#include <map>
#include <cstdio>
#include <stdexcept>
#include "../src/BloomFilterServer/BloomFilterLogic/BloomFilter.h"
#include "../src/BloomFilterServer/hash/HashFunction.h"

using namespace std;

class MockHashFunction : public HashFunction { // A class that inherits from HashFunction
    public:
     // It receives a fixed number fixedValue in the constructor and stores it in value
        explicit MockHashFunction(size_t fixedValue) : value(fixedValue) {}
    
        size_t operator()(const string& str) const override { // Enables the () operator — meaning you can use the class as if it were a hash function.
            // Instead of actually calculating a hash, it always returns the constant value defined in the constructor.
            return value;
        }
        std::string getName() const override {
            return "Mock";
        }
        
    
    private:
        size_t value;
};

class CustomMockHashFunction : public HashFunction {
    public:
        CustomMockHashFunction(const map<string, size_t>& predefined) : hashMap(predefined) {}
    
        size_t operator()(const string& str) const override {
            auto it = hashMap.find(str);
            if (it != hashMap.end())
                return it->second;
            return 0; // defult.
        }
        std::string getName() const override {
            return "Mock";
        } 
    
    private:
        map<string, size_t> hashMap;
};


// test for False Positive:

TEST(BloomFilterTest, FalsePositiveDetectedWhenHashOverlapOccurs) {
    MockHashFunction hash1(2); // always returns 2.
    MockHashFunction hash2(4); // always returns 4.

    vector<HashFunction*> hashes = { &hash1, &hash2 };
    BloomFilter filter(8, hashes); //Building an 8-bit filter with the two constant functions.

    filter.add("real.com"); //Add a real address – this means it will turn on bits 2 and 4.

    EXPECT_TRUE(filter.mightContain("unrelated.com")); //We ask about a completely different address
    // but because it will go through the same functions (which will return 2 and 4), exactly the same 
    //lights will light up — and the filter will think that it might be in, even though we didn't add it.
}

TEST(BloomFilterTest, ThrowExeptionSizeZero) {
    MockHashFunction hash1(2); // always returns 2.

    vector<HashFunction*> hashes = { &hash1 };
    
    EXPECT_THROW({
        BloomFilter filter(0, hashes); //Building an 0-bit filter with the two constant functions.
    }, std::invalid_argument);
}

// test for Persistence:

TEST(BloomFilterTest, CanSaveAndReloadStateFromFile) {
    //Defines the name of a temporary file that will be used to save the filter state.
    const string filename = "test_bloomfilter_save.txt";
    MockHashFunction hash(3); // always returns 3
    vector<HashFunction*> hashes = { &hash };

    {
        BloomFilter filter(8, hashes); //Create a new BloomFilter object with 8 bits.
        filter.add("example.com"); //Add one site — this turns on the 3rd bit
        filter.saveToFile(filename); //Save to file
        EXPECT_TRUE(filter.mightContain("example.com")); //We expect the new filter to recognize that "example.com" exists (because it was loaded from the file).
    }

    {
        BloomFilter reloadedFilter(8, hashes); //create a new (empty) filter with the same size and fire function.
        reloadedFilter.loadFromFile(filename); //Loading the state from the file — should load the same bits we saved earlier.
        EXPECT_TRUE(reloadedFilter.mightContain("example.com")); //We expect the new filter to recognize that "example.com" exists (because it was loaded from the file).
        //EXPECT_FALSE(reloadedFilter.mightContain("other.com")); //We expect that "other.com" does not exist (because we never added it).

    remove(filename.c_str());//delete the temporary file.
    }
}

//Implement test cases with known values:

TEST(BloomFilterTest, AddSetsCorrectBitWithKnownHash) {
    map<string, size_t> hashMap = {
        {"abc.com", 5},
        {"xyz.com", 3}
    };
    CustomMockHashFunction hash(hashMap);
    vector<HashFunction*> hashes = { &hash };

    BloomFilter filter(8, hashes);
    filter.add("abc.com");

    EXPECT_TRUE(filter.mightContain("abc.com"));   // returns 5
    EXPECT_FALSE(filter.mightContain("xyz.com"));  // returns 3
}

TEST(BloomFilterTest, AddSetsMultipleBitsWithMultipleHashes) {
    MockHashFunction hash1(2); // always returns 2
    MockHashFunction hash2(7); // always returns 7
    vector<HashFunction*> hashes = { &hash1, &hash2 };

    BloomFilter filter(8, hashes);
    filter.add("site.com");

    EXPECT_TRUE(filter.mightContain("site.com"));  // becuase we add "site.com" to the filter.
}

TEST(BloomFilterTest, EmptyFilterReturnsFalse) {
    MockHashFunction hash(3); // always returns 3
    vector<HashFunction*> hashes = { &hash };

    BloomFilter filter(8, hashes);
    EXPECT_FALSE(filter.mightContain("notadded.com")); // becuase we didnt add anything.
}

TEST(BloomFilterTest, HashWrapsAroundFilterSize) {
    MockHashFunction hash(10); // Number higher than filter size (8).
    vector<HashFunction*> hashes = { &hash };

    BloomFilter filter(8, hashes);
    filter.add("overflow.com"); //Should turn on the 2 bit.

    EXPECT_TRUE(filter.mightContain("overflow.com")); //index = 10 % 8 = 2;
}