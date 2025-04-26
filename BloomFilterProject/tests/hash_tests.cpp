#include <gtest/gtest.h>
#include "../src/hash/IterativeStdHash.h"
#include <limits>

using namespace std;

// ----------- Sanity Tests -----------
TEST(IterativeStdHashTests, ConstructorInitializeFields) {
    IterativeStdHash iterHash1(1);
    IterativeStdHash iterHash2(2);
    IterativeStdHash iterHash5(5);

    // hash class get name should return the name in this format
    EXPECT_EQ(iterHash1.getName(), "iterative_std::hash_1");
    EXPECT_EQ(iterHash2.getName(), "iterative_std::hash_2");
    EXPECT_EQ(iterHash5.getName(), "iterative_std::hash_5");
}

// same input to the hash function should always!! return the same output (deterministic function)
TEST(IterativeStdHashTests, SameInputSameHashOutput) {
    IterativeStdHash iterHash(2);
    EXPECT_EQ(iterHash("aa"), iterHash("aa"));
}

// activating the same hash function on different inputs, should usually yield different output
TEST(IterativeStdHashTests, DifferentInputDifferentHashOutput) {
    IterativeStdHash iterHash(2);
    EXPECT_NE(iterHash("aa"), iterHash("bb"));
}

// Creating an iterative std hash function pbject with the value 1 - should return the same output as the regular std hash
TEST(IterativeStdHashTests, IterationOneEqualsStdHash) {
    IterativeStdHash iterHash(1);
    std::hash<std::string> stdHash;
    EXPECT_EQ(iterHash("aa"), stdHash("aa"));
}

// ----------- Negative tests -----------
// Trying to create an instance of iterative std hash with 0 iterations should return invalid argument
TEST(IterativeStdHashTests, HandleZeroIterations) {
    EXPECT_THROW(IterativeStdHash iterHash(0), invalid_argument);
}

// ----------- Boundary tests -----------
// empty string should return a value without throwing an error
TEST(IterativeStdHashTests, HandlesEmptyString) {
    IterativeStdHash iterHash(2);
    EXPECT_NO_THROW(iterHash(""));
}

// long string should return a value without throwing an error
TEST(IterativeStdHashTests, LongStringHash) {
    IterativeStdHash iterHash(2);
    std::string longInput(1024, 'x');
    EXPECT_NO_THROW(iterHash(longInput));
}

// large number of iterations should return a value without throwing an error
TEST(IterativeStdHashTests, LargeIterationsNumber) {
    IterativeStdHash iterHash(1000000);
    EXPECT_NO_THROW(iterHash("Hello"));
}


// int main(int argc, char **argv) {
//     ::testing::InitGoogleTest(&argc, argv);
//     return RUN_ALL_TESTS();
// }
