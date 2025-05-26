#pragma once
#ifndef SERVER_H
#define SERVER_H
#include <thread>
#include <atomic>
#include "../commands/CommandResult.h"
#include "../CLIhandler/CLI_handler.h"
#include "ThreadManager.h"

class CLIHandler;

class Server {
    public:
        Server(int port, CLIHandler* handler);               // initialize the server object
        ~Server();

        void start(); // start listening for client
        void stop();  // stop the server safely
        int getPort() const { return port; }
        bool validatePort(int port) const;
        void startClientThread(int clientSocket);

    private:
        // server class attributes
        int port;                       // the port it is listening to
        CLIHandler* handler;            
        ThreadManager threadManager;    // important for thread managment to be detached from the server implementation
        // std::atomic<bool> running;      // boolean value if it is running
        
        std::atomic<bool> running;  // safer boolean for threads
        int serverSock = -1;
        void handleClient(int clientSocket);   
};

#endif // SERVER_H