// this is an interface for all CLI commands

#ifndef ICOMMAND_H
#define ICOMMAND_H

#include <string>

// ICommand is our interface for command execution
class ICommand {
public:
    // virtual destruction of derived classes
    virtual ~ICommand() = default;
    // pure virtual function that recives input URL as argument 
    // and returns logical result (true or false) for server to handle
    virtual std::string execute(const std::string& url) = 0;
};

#endif // ICOMMAND_H
