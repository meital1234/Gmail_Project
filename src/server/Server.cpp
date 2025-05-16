#include "Server.h"
#include <iostream>
#include <fstream>
#include <sstream>
#include <stdexcept>
#include <netinet/in.h>
#include <unistd.h>
#include <cstring>
#include "../src/commands/CommandResult.h"

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

    // auto-register
    handler->registerCommands();

    // Launch server in background thread
    serverThread = std::thread(&Server::run, this);
    std::this_thread::sleep_for(std::chrono::milliseconds(10));
    std::cout << "[Server] Server started on port " << port << std::endl;
}

// Stops the server and joins the thread
void Server::stop() {
    if (!running) return;
    
    running = false;
    
    // Close server socket to unblock accept()
    if (serverSocket >= 0) {
        shutdown(serverSocket, SHUT_RDWR);
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
        if (serverSocket >= 0) {
            close(serverSocket);
            serverSocket = -1;
        }
        running = false;
        return;
    }

    if (listen(serverSocket, 5) < 0) {
        std::cerr << "[Server] Listen failed" << std::endl;
        if (serverSocket >= 0) {
            close(serverSocket);
            serverSocket = -1;
        }
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

    if (serverSocket >= 0) {
        close(serverSocket);
        serverSocket = -1;
    }
}

// Handles a single client connection
void Server::handleClient(int clientSocket) {
    char buffer[1024];

    while (true) {
        ssize_t bytes = recv(clientSocket, buffer, sizeof(buffer)-1, 0);
        if (bytes <= 0) break;
        buffer[bytes] = '\0';
        std::string line(buffer);
        // trim
        line.erase(line.find_last_not_of("\r\n") + 1);
        if (line.empty()) continue;

        // read command to know if its GET
        std::istringstream cmdiss(line);
        std::string cmdToken;
        cmdiss >> cmdToken;

        // execute command via CLIHandker
        CommandResult result = handler->handleCommand(line);
        // build the response
        std::ostringstream out;
        
         if (result.statusCode == StatusCode::Created) {
            out << "201 Created\n\n";    // POST → \n\n
        }
        else if (result.statusCode == StatusCode::NoContent) {
            out << "204 No Content\n\n"; // DELETE → \n\n
        }
        else if (result.statusCode == StatusCode::OK) {
            out << "200 Ok\n";           // GET-positive → \n (boolean follows)
        }
        // NotFound (split GET vs non-GET)
        else if (result.statusCode == StatusCode::NotFound) {
            if (cmdToken == "GET") {
                out << "404 Not Found\n";
            } else {
                out << "404 Not Found\n\n";
            }
        }
        // BadRequest (split GET vs non-GET)
        else if (result.statusCode == StatusCode::BadRequest) {
            if (cmdToken == "GET") {
                out << "400 Bad Request\n";
            } else {
                out << "400 Bad Request\n\n";
            }
        }
        // boolean line for GET only & not malformed
        if (cmdToken == "GET" && result.statusCode != StatusCode::BadRequest) {
            out << "\n";  // exactly one extra \n
            if (result.bloomMatch) {
                out << (result.blackMatch ? "TRUE TRUE\n" : "TRUE FALSE\n");
            } else {
                out << "FALSE\n";
            }
        }
        // send response & close socket
        std::string response = out.str();
        send(clientSocket, response.c_str(), response.size(), 0);
    }

    close(clientSocket);
}
