#include <gtest/gtest.h>
#include "../src/server/Server.h"   // Server class
#include "../src/CLIhandler/CLI_handler.h"   // CLIHandler to link to server
#include "../src/BloomFilterLogic/BloomFilter.h" // for completeness
#include <fstream>
#include <iostream>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <unistd.h>
#include <string.h>


// Helper client class to simulate real connection to server
// each instance connects to the TCP server and sends commands
class TestClient {
public:
    TestClient(const std::string& ip = "127.0.0.1", int port = 5555) {
        sock = socket(AF_INET, SOCK_STREAM, 0);
        if (sock < 0) throw std::runtime_error("Socket creation failed");

        sockaddr_in sin{};
        sin.sin_family = AF_INET;
        sin.sin_port = htons(port);
        sin.sin_addr.s_addr = inet_addr(ip.c_str());

        if (connect(sock, (struct sockaddr*)&sin, sizeof(sin)) < 0) {
            close(sock);
            throw std::runtime_error("Connection failed");
        }
    }
    // Destructor - closes socket
     ~TestClient() {
        if (sock >= 0) close(sock);
    }

    // Sends a line to server and returns the response
        std::string sendToServer(const std::string& cmd) {
        std::string fullCmd = cmd + "\n";
        if (send(sock, fullCmd.c_str(), fullCmd.size(), 0) < 0)
            throw std::runtime_error("Send failed");

        char buffer[4096];
        int received = recv(sock, buffer, sizeof(buffer) - 1, 0);
        if (received <= 0)
            throw std::runtime_error("Receive failed or connection closed");

        buffer[received] = '\0';
        return std::string(buffer);
    }

private:
    int sock;
};

// ==========================
// ScopedServer guard
// ==========================
struct ScopedServer {
    Server& server;
    ScopedServer(Server& s) : server(s) { 
        server.start(); 
    }
    ~ScopedServer() {
        std::cout << "[Test] Stopping server" << std::endl;
        server.stop();
    }
};

// ==========================
// Helper macro for dynamic port
// ==========================
#define UNIQUE_PORT (10000 + __LINE__)

// ===========================================================
// Connection Tests: server availability, protocol correctness
// ===========================================================

// POST command should return 201 Created
TEST(ServerCommandTests, PostAddsUrl) {
    CLIHandler handler;
    
    handler.loadOrInitializeBloomFilter("8 1");
    // handler.registerCommands();
    int port = UNIQUE_PORT;
    Server server(port, &handler);
    ScopedServer guard(server);
    server.start();
    std::unique_ptr<TestClient> client;
    for (int i = 0; i < 2; i++) {
        try {
            client = std::make_unique<TestClient>("127.0.0.1", port);
            break;
        } catch (...) {
            std::this_thread::sleep_for(std::chrono::milliseconds(500));
        }
    }
    
    EXPECT_EQ(client->sendToServer("POST www.posttest.com"), "201 Created\n\n");
}

// GET unknown URL should return false
TEST(ServerCommandTests, GetReturnsFalseForNewUrl) {
    CLIHandler handler;
    
    handler.loadOrInitializeBloomFilter("8 1");
    int port = UNIQUE_PORT;
    Server server(port, &handler); 
    ScopedServer guard(server); 

    // TestClient client("127.0.0.1", port);
    std::unique_ptr<TestClient> client;
    for (int i = 0; i < 2; i++) {
        try {
            client = std::make_unique<TestClient>("127.0.0.1", port);
            break;
        } catch (...) {
            std::this_thread::sleep_for(std::chrono::milliseconds(500));
        }
    }
    EXPECT_EQ(client->sendToServer("GET unknown.com"), "404 Not Found\n\nFALSE\n");
}

// GET after POST should return true true
TEST(ServerCommandTests, GetReturnsTrueForAddedUrl) {
    CLIHandler handler;
    handler.loadOrInitializeBloomFilter("8 1");
    int port = UNIQUE_PORT;

    Server server(port, &handler);
    ScopedServer guard(server);

    std::unique_ptr<TestClient> client;
    for (int i = 0; i < 2; i++) {
        try {
            client = std::make_unique<TestClient>("127.0.0.1", port);
            break;
        } catch (...) {
            std::this_thread::sleep_for(std::chrono::milliseconds(500));
        }
    }

    client->sendToServer("POST www.exists.com");
    EXPECT_EQ(client->sendToServer("GET www.exists.com"), "200 Ok\n\nTRUE TRUE\n");
}


// DELETE known URL should return 204 No Content
TEST(ServerCommandTests, DeleteUrlReturns204) {
    CLIHandler handler;
    handler.loadOrInitializeBloomFilter("8 1");
    int port = UNIQUE_PORT;

    Server server(port, &handler);
    ScopedServer guard(server);

    // TestClient client("127.0.0.1", port);
    std::unique_ptr<TestClient> client;
    for (int i = 0; i < 2; i++) {
        try {
            client = std::make_unique<TestClient>("127.0.0.1", port);
            break;
        } catch (...) {
            std::this_thread::sleep_for(std::chrono::milliseconds(500));
        }
    }
    
    client->sendToServer("POST www.todelete.com");
    EXPECT_EQ(client->sendToServer("DELETE www.todelete.com"), "204 No Content\n\n");
}


// DELETE unknown URL should return 404 Not Found
TEST(ServerCommandTests, DeleteUnknownUrlReturns404) {
    CLIHandler handler;
    handler.loadOrInitializeBloomFilter("8 1");
    int port = UNIQUE_PORT;

    Server server(port, &handler);
    ScopedServer guard(server);

    std::unique_ptr<TestClient> client;
    for (int i = 0; i < 2; i++) {
        try {
            client = std::make_unique<TestClient>("127.0.0.1", port);
            break;
        } catch (...) {
            std::this_thread::sleep_for(std::chrono::milliseconds(500));
        }
    }
    
    EXPECT_EQ(client->sendToServer("DELETE www.nonexistent.com"), "404 Not Found\n\n");
}


// Sending unknown command returns 400 Bad Request
TEST(ServerCommandTests, UnknownCommandReturns400) {
    CLIHandler handler;
    handler.loadOrInitializeBloomFilter("8 1");
    int port = UNIQUE_PORT;

    Server server(port, &handler); 
    ScopedServer guard(server);

    // TestClient client("127.0.0.1", port);
    std::unique_ptr<TestClient> client;
    for (int i = 0; i < 2; i++) {
        try {
            client = std::make_unique<TestClient>("127.0.0.1", port);
            break;
        } catch (...) {
            std::this_thread::sleep_for(std::chrono::milliseconds(500));
        }
    }
    
    EXPECT_EQ(client->sendToServer("RANDOM COMMAND"), "400 Bad Request\n\n");
}


// Sending malformed GET returns 400 Bad Request
TEST(ServerCommandTests, MalformedGetReturns400) {
    CLIHandler handler;
    handler.loadOrInitializeBloomFilter("8 1");
    int port = UNIQUE_PORT;

    Server server(port, &handler);
    ScopedServer guard(server);

    // TestClient client("127.0.0.1", port);
    std::unique_ptr<TestClient> client;
    for (int i = 0; i < 2; i++) {
        try {
            client = std::make_unique<TestClient>("127.0.0.1", port);
            break;
        } catch (...) {
            std::this_thread::sleep_for(std::chrono::milliseconds(500));
        }
    }
    
    EXPECT_EQ(client->sendToServer("GET too many args"), "400 Bad Request\n");
}


// POST, DELETE and GET returns true false (Bloom yes, blacklist no)
TEST(ServerCommandTests, PostDeleteThenGetReturnsTrueFalse) {
    CLIHandler handler;
    handler.loadOrInitializeBloomFilter("8 1");
    int port = UNIQUE_PORT;

    Server server(port, &handler);
    ScopedServer guard(server);

    // TestClient client("127.0.0.1", port);
    std::unique_ptr<TestClient> client;
    for (int i = 0; i < 2; i++) {
        try {
            client = std::make_unique<TestClient>("127.0.0.1", port);
            break;
        } catch (...) {
            std::this_thread::sleep_for(std::chrono::milliseconds(500));
        }
    }
    
    client->sendToServer("POST www.example.com");
    client->sendToServer("DELETE www.example.com");

    EXPECT_EQ(client->sendToServer("GET www.example.com"), "200 Ok\n\nTRUE FALSE\n");
}


// Continuity Test: URL persists between server restarts
TEST(ServerContinuityTests, KeepsUrlBetweenRuns) {
    CLIHandler handler;
    handler.loadOrInitializeBloomFilter("8 1");
    
    int port = UNIQUE_PORT;
    
    Server server(port, &handler);
    {
        ScopedServer guard(server);

        // TestClient client("127.0.0.1", port);
        std::unique_ptr<TestClient> client;
        for (int i = 0; i < 2; i++) {
            try {
                client = std::make_unique<TestClient>("127.0.0.1", port);
                break;
            } catch (...) {
                std::this_thread::sleep_for(std::chrono::milliseconds(500));
            }
        }
        client->sendToServer("POST www.persistent.com");
    } // server.stop() on scope exit

    server.start(); // restart manually for continuity test
    // TestClient client("127.0.0.1", port);
    std::unique_ptr<TestClient> client;
    for (int i = 0; i < 2; i++) {
        try {
            client = std::make_unique<TestClient>("127.0.0.1", port);
            break;
        } catch (...) {
            std::this_thread::sleep_for(std::chrono::milliseconds(500));
        }
    }
    
    EXPECT_EQ(client->sendToServer("GET www.persistent.com"), "200 Ok\n\nTRUE TRUE\n");

    server.stop(); // make sure to stop after restart too

}
