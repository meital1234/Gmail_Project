#pragma once
#ifndef SERVER_H
#define SERVER_H

#include <atomic>
#include <memory>

class Server {
private:
    // server class attributes
    int port;                       // the port it is listening to
    std::atomic<bool> running;      // boolean value if it is running
    void acceptConnections();       // and private function to accept connections - to be called from start

public:
    Server(int port);               // initialize the server object
    ~Server();

    void start(); // start listening for client
    void stop();  // stop the server safely

    bool validatePort(int port) const;
};

#endif // SERVER_H