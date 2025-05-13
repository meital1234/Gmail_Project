#include "Server.h"
#include <iostream>
#include <fstream>
#include <sstream>
#include <stdexcept>
#include <netinet/in.h>
#include <unistd.h>
#include <cstring>

using namespace std;

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
    std::cout << "Listening on port " << port << "..." << std::endl;
    
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

                std::string result = handler->handleCommand(line);
                std::string finalResponse;

                std::string commandType = line.substr(0, line.find(' '));

                if (commandType == "GET") {
                    if (result == "true true" || result == "true false" || result == "false") {
                        finalResponse = "200 OK\n" + result + "\n";
                    } else {
                        finalResponse = "400 Bad Request\n" + result + "\n";
                    }
                } else if (commandType == "POST") {
                    if (result == "success") {
                        finalResponse = "201 Created\n";
                    } else {
                        finalResponse = "400 Bad Request\n" + result + "\n";
                    }
                } else if (commandType == "DELETE") {
                    if (result == "deleted") {
                        finalResponse = "204 No Content\n";
                    } else if (result == "not found") {
                        finalResponse = "404 Not Found\n";
                    } else {
                        finalResponse = "400 Bad Request\n" + result + "\n";
                    }
                } else {
                    finalResponse = "400 Bad Request\n";
                }

                send(clientSock, finalResponse.c_str(), finalResponse.size(), 0);
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
