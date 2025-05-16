#pragma once
#include <string>

enum STATUS_CODE{
    OK = 200,
    CREATED = 201,
    NO_CONTENT = 204,
    BAD_REQ = 400,
    NOTFOUND = 404,
    DEFAULT = 0,
};

// Structure to hold the result of a command execution.
struct CommandResult {
    bool GoodCommand = false; // Indicates if the command was recognized and overall proccessed correctly
    bool NotFound = false; // for DELETE - true if the URL was not found
    std::string Useroutput; // for GET commands: the response content
    STATUS_CODE status = STATUS_CODE::DEFAULT;
};
