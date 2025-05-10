#include "Server.h"
#include <iostream>
#include <stdexcept>
#include <netinet/in.h>
#include <unistd.h>
#include <cstring>

// initialize server - is not running at the start
Server::Server(int port, CLIHandler* handler)
    : port(port), handler(handler), running(false) {}

Server::~Server() {
    stop();
}

// make sure port is in range
bool Server::validatePort(int port) const {
    return port > 1024 && port <= 65535;
}

// start server
void Server::start() {
    
    if (!validatePort(port)) {
        throw std::invalid_argument("Invalid port number.");
    }

    int serverSock = socket(AF_INET, SOCK_STREAM, 0);
    if (serverSock < 0) {
        throw std::runtime_error("Socket creation failed");
    }

    int opt = 1;
    setsockopt(serverSock, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));

    sockaddr_in sin{};
    sin.sin_family = AF_INET;
    sin.sin_addr.s_addr = INADDR_ANY;
    sin.sin_port = htons(port);

    if (bind(serverSock, (struct sockaddr*)&sin, sizeof(sin)) < 0) {
        close(serverSock);
        throw std::runtime_error("Bind failed");
    }

    if (listen(serverSock, 1) < 0) {
        close(serverSock);
        throw std::runtime_error("Listen failed");
    }

    running = true;
    std::cout << "Server started on port " << port << std::endl;

    while (running) {
        sockaddr_in clientAddr;
        socklen_t addrLen = sizeof(clientAddr);
        int clientSock = accept(serverSock, (struct sockaddr*)&clientAddr, &addrLen);
        if (clientSock < 0) continue;

        char buffer[4096];
        std::string leftover;

        while (true) {
            ssize_t received = recv(clientSock, buffer, sizeof(buffer) - 1, 0);
            if (received <= 0) break;

            buffer[received] = '\0';
            leftover += buffer;

            size_t newlinePos;
            while ((newlinePos = leftover.find('\n')) != std::string::npos) {
                std::string line = leftover.substr(0, newlinePos);
                leftover = leftover.substr(newlinePos + 1);

                std::string response = handler->handleCommand(line);
                send(clientSock, response.c_str(), response.size(), 0);
            }
        }

        close(clientSock);
    }

    close(serverSock);
}

void Server::stop() {
    running = false;
    std::cout << "Server stopped." << std::endl;
}
