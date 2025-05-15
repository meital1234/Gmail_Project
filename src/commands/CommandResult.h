#pragma once
#include <string>

// Structure to hold the result of a command execution.
struct CommandResult {
    bool GoodCommand = false; // Indicates if the command was recognized and processed correctly
    bool NotFound = false; // for DELETE - true if the URL was not found
    std::string Useroutput; // for GET commands: the response content
};
