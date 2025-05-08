// this is an interface for all CLI commands

#ifndef ICOMMAND_H
#define ICOMMAND_H

#include <string>

// ICommand is our interface for command execution
class ICommand {
public:
    // pure virtual method that executes the command on given arg
    virtual void execute(const std::string& argument) = 0;

    // virtual destructor for cleanup
    virtual ~ICommand() = default;
};

#endif // ICOMMAND_H
