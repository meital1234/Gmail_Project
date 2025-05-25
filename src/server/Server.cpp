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
    : port(port), handler(handler), running(false), serverSock(-1) {}
    
Server::~Server() {
    stop();
}

// make sure port is in range
bool Server::validatePort(int port) const {
    return port > 1024 && port <= 65535;
}

void Server::startClientThread(int clientSocket) {
    threadManager.run([this, clientSocket]() {
        handleClient(clientSocket);  // use private server function from inside - encapsulation
    });
}

// start server
void Server::start() {
    if (!validatePort(port)) {
        throw std::invalid_argument("Invalid port number.");
    }

    serverSock = socket(AF_INET, SOCK_STREAM, 0);
    if (serverSock < 0) {
        throw std::runtime_error("Socket creation failed");
    }
    // std::cout << "Listening on port " << port << "..." << std::endl;
    
    int opt = 1;
    setsockopt(serverSock, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));

    sockaddr_in sin{};
    sin.sin_family = AF_INET;
    sin.sin_addr.s_addr = INADDR_ANY;
    sin.sin_port = htons(port);

    if (::bind(serverSock, (struct sockaddr*)&sin, sizeof(sin)) < 0) {
        close(serverSock);
        throw std::runtime_error("Bind failed");
    }

    if (listen(serverSock, 1) < 0) {
        close(serverSock);
        throw std::runtime_error("Listen failed");
    }

    running = true;

    while (running) {
        sockaddr_in clientAddr;
        socklen_t addrLen = sizeof(clientAddr);
        int clientSock = accept(serverSock, (struct sockaddr*)&clientAddr, &addrLen);
        if (clientSock < 0) {
            if (running) perror("accept failed");
            break;
        }
        startClientThread(clientSock);
    }
}

void Server::handleClient(int clientSock) {
    std::cout << "[Thread " << std::this_thread::get_id()
              << "] Handling client socket: " << clientSock << std::endl;
    char buffer[4096];
    std::string leftover;

    // Step 1: Read configuration line
    std::string configLine;
    while (true) {
        ssize_t received = recv(clientSock, buffer, sizeof(buffer) - 1, 0);
        if (received <= 0) return;

        buffer[received] = '\0';
        leftover += buffer;

        size_t newlinePos = leftover.find('\n');
        if (newlinePos != std::string::npos) {
            configLine = leftover.substr(0, newlinePos);
            leftover = leftover.substr(newlinePos + 1);
            // std::cerr << "[Server] Config line received: '" << configLine << "'" << std::endl;
            break;
        }
    }

    // Step 2: Initialize Bloom filter
    if (!handler->loadOrInitializeBloomFilter(configLine)) {
        std::string error = "400 Bad Request\n";
        send(clientSock, error.c_str(), error.size(), 0);
        return;
    }

    handler->registerCommands();
  
    // Step 3: Process commands
    while (true) {
        // Check for full lines already received
        size_t newlinePos;
        while ((newlinePos = leftover.find('\n')) != std::string::npos) {
            std::string line = leftover.substr(0, newlinePos);
            leftover = leftover.substr(newlinePos + 1);
            // Trim newline and carriage return
        line.erase(line.find_last_not_of("\r\n") + 1);
        if (line.empty()) continue;

        // Extract command type (GET, POST, DELETE, etc.)
        std::istringstream cmdiss(line);
        std::string cmdToken;
        cmdiss >> cmdToken;

        // Execute command
        CommandResult result = handler->handleCommand(line);

        // Build HTTP-style response
        std::ostringstream out;
        if (result.statusCode == StatusCode::Created) {
            out << "201 Created\n";
        } else if (result.statusCode == StatusCode::NoContent) {
            out << "204 No Content\n";
        } else if (result.statusCode == StatusCode::OK) {
            out << "200 Ok\n";
        } else if (result.statusCode == StatusCode::NotFound) {
            out << (cmdToken == "GET" ? "404 Not Found\n" : "404 Not Found\n");
        } else if (result.statusCode == StatusCode::BadRequest) {
            out << (cmdToken == "GET" ? "400 Bad Request\n" : "400 Bad Request\n");
        }

        if (cmdToken == "GET" && result.statusCode != StatusCode::BadRequest) {
            out << "\n";
            if (result.bloomMatch) {
                out << (result.blackMatch ? "true true\n" : "true false\n");
            } else {
                out << "false\n";
            }
        }

        std::string response = out.str();
        send(clientSock, response.c_str(), response.size(), 0);
    }

    // Read more data from the socket
    ssize_t received = recv(clientSock, buffer, sizeof(buffer) - 1, 0);
    if (received <= 0) break;

    buffer[received] = '\0';
    leftover += buffer;
    }

    close(clientSock);
}

void Server::stop() {
    running = false;
    // std::cout << "Server stopped." << std::endl;

    // This will unblock the accept() call
    if (serverSock >= 0) {
        // std::cerr << "[Server] Shutting down listening socket\n";
        shutdown(serverSock, SHUT_RDWR);
        close(serverSock);
        serverSock = -1;
    }
}