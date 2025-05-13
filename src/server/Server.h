#pragma once
#ifndef SERVER_H
#define SERVER_H
#include <atomic>
#include "../CLIhandler/CLI_handler.h"


class Server {
    private:
        // server class attributes
        int port;                       // the port it is listening to
        CLIHandler* handler;            // optional - to pass the logic handler as an attribute of the server
        std::atomic<bool> running;      // boolean value if it is running
 

    public:
        Server(int port, CLIHandler* handler);               // initialize the server object
        ~Server();

        void start(); // start listening for client
        void stop();  // stop the server safely

        bool validatePort(int port) const;
};

#endif // SERVER_H