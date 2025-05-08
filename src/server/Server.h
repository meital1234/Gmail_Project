#pragma once
#ifndef SERVER_H
#define SERVER_H

#include <atomic>
#include <memory>

class Server {
private:
    int port;
    std::atomic<bool> running;
    void acceptConnections();

public:
    Server(int port);
    ~Server();

    void start(); // Starts listening for clients and dispatches requests
    void stop();  // Stops the server safely

    bool validatePort(int port) const;
};

#endif // SERVER_H