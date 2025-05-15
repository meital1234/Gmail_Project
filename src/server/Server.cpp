#include "Server.h"
#include <iostream>
#include <fstream>
#include <sstream>
#include <stdexcept>
#include <netinet/in.h>
#include <unistd.h>
#include <cstring>

using namespace std;

Server::Server(int port, CLIHandler* handler) : port(port), handler(handler), running(false), serverSocket(-1) {}

Server::~Server() {
    stop();
}

// Starts the server in a non-blocking thread
void Server::start() {
    if (running) {
        std::cout << "[Server] Already running on port " << port << std::endl;
        return;
    }

    running = true;

    // Launch server in background thread
    serverThread = std::thread(&Server::run, this);

    std::cout << "[Server] Server started on port " << port << std::endl;
}

// Stops the server and joins the thread
void Server::stop() {
    if (!running) return;

    running = false;

    // Close server socket to unblock accept()
    if (serverSocket >= 0) {
        close(serverSocket);
        serverSocket = -1;
    }

    // Join the server thread safely
    if (serverThread.joinable()) {
        serverThread.join();
    }

    std::cout << "[Server] Server stopped." << std::endl;
}

// Main server loop: accepts connections and processes commands
void Server::run() {
    serverSocket = socket(AF_INET, SOCK_STREAM, 0);
    if (serverSocket < 0) {
        std::cerr << "[Server] Socket creation failed" << std::endl;
        running = false;
        return;
    }

    sockaddr_in sin{};
    sin.sin_family = AF_INET;
    sin.sin_port = htons(port);
    sin.sin_addr.s_addr = INADDR_ANY;

    if (bind(serverSocket, (sockaddr*)&sin, sizeof(sin)) < 0) {
        std::cerr << "[Server] Bind failed" << std::endl;
        close(serverSocket);
        serverSocket = -1;
        running = false;
        return;
    }

    if (listen(serverSocket, 5) < 0) {
        std::cerr << "[Server] Listen failed" << std::endl;
        close(serverSocket);
        serverSocket = -1;
        running = false;
        return;
    }

    std::cout << "[Server] Listening on port " << port << "..." << std::endl;

    while (running) {
        sockaddr_in clientAddr;
        socklen_t clientLen = sizeof(clientAddr);

        int clientSocket = accept(serverSocket, (sockaddr*)&clientAddr, &clientLen);
        if (clientSocket < 0) {
            if (running) std::cerr << "[Server] Accept failed" << std::endl;
            continue;  // could be interrupted by stop()
        }

        std::thread(&Server::handleClient, this, clientSocket).detach();
    }

    close(serverSocket);
    serverSocket = -1;
}

// Handles a single client connection
void Server::handleClient(int clientSocket) {
    char buffer[1024];
    std::string response;
    std::string GEToutput;

    while (true) {
        ssize_t bytesReceived = recv(clientSocket, buffer, sizeof(buffer) - 1, 0);
        if (bytesReceived <= 0) break;

        buffer[bytesReceived] = '\0';
        std::string clientInput(buffer);

        // Trim newline characters
        clientInput.erase(clientInput.find_last_not_of("\r\n") + 1);

        if (clientInput.empty()) continue;

        CommandResult result = handler->handleCommand(clientInput, GEToutput);

        if (!result.GoodCommand) {
            if (result.Useroutput.empty() && result.NotFound) {
                response = "404 Not Found\n";
            } else if (result.Useroutput.empty()) {
                response = "400 Bad Request\n";
            } else {
                response = "200 Ok\n\n" + result.Useroutput + "\n";
            }
        } else {
            if (result.Useroutput.empty() && result.NotFound) {
                response = "204 No Content\n";
            } else if (result.Useroutput.empty()) {
                response = "201 Created\n";
            } else {
                response = "200 Ok\n\n" + result.Useroutput + "\n";
            }
        }

        send(clientSocket, response.c_str(), response.size(), 0);
    }

    close(clientSocket);
}

// Server::Server(int port, CLIHandler* handler) : port(port), handler(handler), running(false) {}
// 
// Server::~Server() {
//     stop();
// }
// 
// bool Server::validatePort(int port) const {
//     return port > 1024 && port <= 65535;
// }
// 
// void Server::start() {
//     if (!validatePort(port)) {
//         throw std::invalid_argument("Invalid port number.");
//     }
// 
//     int serverSock = socket(AF_INET, SOCK_STREAM, 0);
//     if (serverSock < 0) {
//         throw std::runtime_error("Socket creation failed");
//     }
// 
//     std::cout << "[Server] Listening on port " << port << "..." << std::endl;
// 
//     int opt = 1;
//     setsockopt(serverSock, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));
// 
//     sockaddr_in sin{};
//     sin.sin_family = AF_INET;
//     sin.sin_addr.s_addr = INADDR_ANY;
//     sin.sin_port = htons(port);
// 
//     if (bind(serverSock, (struct sockaddr*)&sin, sizeof(sin)) < 0) {
//         close(serverSock);
//         throw std::runtime_error("Bind failed");
//     }
// 
//     if (listen(serverSock, 1) < 0) {
//         close(serverSock);
//         throw std::runtime_error("Listen failed");
//     }
// 
//     running = true;
//     std::cout << "[Server] Server started on port " << port << std::endl;
// 
//     while (running) {
//         sockaddr_in clientAddr;
//         socklen_t addrLen = sizeof(clientAddr);
//         int clientSock = accept(serverSock, (struct sockaddr*)&clientAddr, &addrLen);
//         if (clientSock < 0) continue;
// 
//         std::cout << "[Server] Client connected." << std::endl;
// 
//         char buffer[4096];
//         std::string leftover;
//         bool initialized = false;
// 
//         while (true) {
//             ssize_t received = recv(clientSock, buffer, sizeof(buffer) - 1, 0);
//             if (received <= 0) {
//                 std::cout << "[Server] Client recv error or disconnect (received = " << received << ")" << std::endl;
//                 break;
//             }
//             
//             buffer[received] = '\0';
//             leftover += buffer;
// 
//             size_t newlinePos;
//             while ((newlinePos = leftover.find('\n')) != std::string::npos) {
//                 std::string line = leftover.substr(0, newlinePos);
//                 leftover = leftover.substr(newlinePos + 1);
// 
//                 // line.erase(line.find_last_not_of(" \n\r\t") + 1);
// 
//                 std::string finalResponse;
// 
//                 std::cout << "[Server] Received line: " << line << std::endl;
// 
//                 // if (!initialized && isConfigLine(line)) {
//                 //     bool GoodConfig = handler->loadOrInitializeBloomFilter(line);
//                 //     if (GoodConfig) {
//                 //         initialized = true;
//                 //         handler->registerCommands();
//                 //         std::cout << "[Server] Configuration line loaded successfully." << std::endl;
//                 //         continue;
//                 //     } else {
//                 //         finalResponse = "400 Bad Request\n";
//                 //         send(clientSock, finalResponse.c_str(), finalResponse.size(), 0);
//                 //         continue;
//                 //     }
//                 // }
// 
//                 if (!initialized) {
//                     bool GoodConfig = handler->loadOrInitializeBloomFilter(line);
//                     if (GoodConfig) {
//                         initialized = true;
//                         handler->registerCommands();
//                         std::cout << "[Server] Configuration line loaded successfully." << std::endl;
//                         finalResponse = "200 OK\n";
//                         // continue;
//                     } else {
//                         finalResponse = "400 Bad Request\n";
//                     }
//                     send(clientSock, finalResponse.c_str(), finalResponse.size(), 0);
//                     continue;
//                 }
// 
//                 std::istringstream iss(line);
//                 std::string CommandType;
//                 iss >> CommandType;
// 
//                 std::string GEToutput;
//                 CommandResult Result = handler->handleCommand(line, GEToutput);
//                 
//                 if (!Result.GoodCommand) {
//                     finalResponse = "400 Bad Request\n";
//                 } else if (CommandType == "GET") {
//                     finalResponse = "200 OK\n" + GEToutput + "\n";
//                 } else if (CommandType == "POST") {
//                     finalResponse = "201 Created\n";
//                 } else if (CommandType == "DELETE") {
//                     finalResponse = Result.NotFound ? "404 Not Found\n" : "204 No Content\n";
//                 } else {
//                     finalResponse = "400 Bad Request\n";
//                 }
// 
// 
//                 
//                 // if (!Result.GoodCommand) {
//                 //     std::cout << "[Server] Invalid command or bad request" << std::endl;
//                 //     finalResponse = "400 Bad Request\n";
//                 // } else if (CommandType == "GET") {
//                 //     std::cout << "[Server] GET command succeeded. Useroutput: " << GEToutput << std::endl;
//                 //     finalResponse = "200 OK\n" + GEToutput + "\n";
//                 // } else if (CommandType == "POST") {
//                 //     std::cout << "[Server] POST command succeeded" << std::endl;
//                 //     finalResponse = "201 Created\n";
//                 // } else if (CommandType == "DELETE") {
//                 //     if (Result.NotFound) {
//                 //         std::cout << "[Server] DELETE command failed (404 Not Found)" << std::endl;
//                 //         finalResponse = "404 Not Found\n";
//                 //     } else {
//                 //         std::cout << "[Server] DELETE command succeeded" << std::endl;
//                 //         finalResponse = "204 No Content\n";
//                 //     }
//                 // } else {
//                 //     std::cout << "[Server] Unknown command type handled" << std::endl;
//                 //     finalResponse = "400 Bad Request\n";
//                 // }
// 
//                 std::cout << "[Server] Sending response: " << finalResponse;
//                 send(clientSock, finalResponse.c_str(), finalResponse.size(), 0);
//             }
//         }
// 
//         std::cout << "[Server] Client disconnected." << std::endl;
//         close(clientSock);
//     }
// 
//     close(serverSock);
// }
// 
// void Server::stop() {
//     running = false;
//     std::cout << "[Server] Server stopped." << std::endl;
// }
// 
// bool Server::isConfigLine(const std::string& line) {
//     std::istringstream iss(line);
//     int value;
//     int count = 0;
//     while (iss >> value) {
//         if (value <= 0) return false;
//         ++count;
//     }
//     return count >= 2;
// }
// 