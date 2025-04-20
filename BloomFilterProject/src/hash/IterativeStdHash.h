#pragma once
#include "HashFunction.h"
#include <string>

class IterativeStdHash : public HashFunction {
private:
    size_t iterations;

public:
    explicit IterativeStdHash(size_t n);

    size_t operator()(const std::string& input) const override;

    std::string getName() const override;
};
