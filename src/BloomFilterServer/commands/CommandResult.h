#pragma once

enum class StatusCode {
    OK         = 200,  // GET hit: TRUE TRUE | TRUE FALSE | FALSE
    Created    = 201,  // POST succeeded
    NoContent  = 204,  // DELETE succeeded
    BadRequest = 400,  // invalid command
    NotFound   = 404   // GET/DELETE on a URL that doesn’t exist
};

// Structure to hold the result of a command execution
// GET will return TRUE TRUE \ TRUE FALSE \ FALSE - contains bloomMatch & blackMatch
// ADD or DELETE will return relevant StatusCode
struct CommandResult {
    StatusCode statusCode;  // for all  commands
    bool bloomMatch = false; // only relevant for GET - indicates if URL is in bloomFilter
    bool blackMatch = false; // only relevant for GET - indicates if URL was found in Blacklist
    

    // constructs a CommandResult object that allows to reset boolian fields exept for GET
    explicit CommandResult(StatusCode c)
        : statusCode(c)
    {}

    // constructs a CommandResult object that builds the meaning of GET
    CommandResult(StatusCode c, bool bfm, bool blm) 
        : statusCode(c)
        , bloomMatch(bfm)
        , blackMatch(blm)
    {}
};
