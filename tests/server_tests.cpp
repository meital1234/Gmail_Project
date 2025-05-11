#include <gtest/gtest.h>
#include "../src/server/Server.h"  // or your actual TCPServer header when it exists
#include "../src/CLIhandler/CLI_handler.h"  
#include "../src/BloomFilterLogic/BloomFilter.h"
#include <fstream>
#include <iostream>
#include <sys/socket.h>
#include <stdio.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <unistd.h>
#include <string.h>

// what do i need to test the server for?
// socket connections tests (keeps connection alive)
// correct response to GET/POST/DELETE commands sent from client

// so, i want to implement a client class in cpp used for the tests, each instance of this class would connect 
// to my server's socket in order to preform all the tests.
class TestClient {
    public:
        // the TestClient constructor - defaults with localhost:5555
        TestClient(const std::string& ip = "127.0.0.1", int port = 5555) {
            // creates a TCP socket using IPv4 and default protocol (TCP)
            sock = socket(AF_INET, SOCK_STREAM, 0);
            // if the socket couldn't be created throw an error and stop
            if (sock < 0) throw std::runtime_error("Socket creation failed");
            // create a struct to hold the server's information
            sockaddr_in sin;
            sin.sin_family = AF_INET;
            sin.sin_port = htons(port);
            sin.sin_addr.s_addr = inet_addr(ip.c_str());
            
            // try to connect the socket to the server. if it fails, close the socket and throw an error
            if (connect(sock, (struct sockaddr*)&sin, sizeof(sin)) < 0) {
                close(sock);
                throw std::runtime_error("Connection failed");
            }
        }

        // // the TestClient deconstructor
        ~TestClient() {
            if (sock >= 0) close(sock);
        }
        
        // this function sends a command to the server and returns the response
        std::string sendToServer(const std::string& cmd) {
            // sends the command with the socket. if it fails throws error
            std::string fullCmd = cmd + "\n";
            if (send(sock, fullCmd.c_str(), fullCmd.size(), 0) < 0)
                throw std::runtime_error("Send failed");
            
            // create a buffer array to save the server's response
            char buffer[4096];
            int expected_data_len = sizeof(buffer);
            int received = recv(sock, buffer, expected_data_len, 0);
            // if nothing is received or the connection closed throw error
            if (received <= 0)
                throw std::runtime_error("Receive failed or connection closed");
    
            buffer[received] = '\0';
            return std::string(buffer);
        }
    
    private:
        int sock;
    };
       
// also adding a test handler class in order for the tests to work on the server only without testing the logic behind it (tested in other setions)
class TestHandler {
    public:
        std::string handleLine(const std::string& line) {
            (void)line;
            return "world\n";
        }
    }


// -------------------- Connection Tests --------------------
// test using the testHandler class that the server starts without crashing and handles the handler output
TEST(ServerConnectionTests, ServerStartssWithTestHandler) {
    TestHandler handler;
    Server server(54321, &handler);
    server.start();
    TestClient client("127.0.0.1", 54321);
    EXPECT_EQ(client.sendToServer("hello"), "world\n");
}

// test with the same testHandler class that the server handles empty input
TEST(ServerConnectionTests, HandlesEmptyInput) {
    TestHandler handler;
    Server server(54321, &handler);
    server.start();
    TestClient client("127.0.0.1", 54321);
    EXPECT_EQ(client.sendToServer(""), "400 Bad Request\n");
}

// -------------------- Command Tests --------------------
// added one test for each command the server should know how to handle
// sending POST to server should return the 201 response
TEST(ServerCommandTests, PostAddsUrl) {
    CLIHandler handler;
    handler.loadOrInitializeBloomFilter("8 1");
    Server server(8080, &handler);
    server.start();
    TestClient client("127.0.0.1", 8080);
    EXPECT_EQ(client.sendToServer("POST www.posttest.com"), "201 Created\n");
}

// sending GET to server before adding any url should return false
TEST(ServerCommandTests, GetReturnsFalseForNewUrl) {
    CLIHandler handler;
    handler.loadOrInitializeBloomFilter("8 1");
    Server server(8888, &handler);
    server.start();
    TestClient client("127.0.0.1", 8888);
    std::string response = client.sendToServer("GET www.gettest.com");
    EXPECT_TRUE(response == "200 Ok\n\nfalse");
}

// sending GET to server after adding the url should return true
TEST(ServerCommandTests, GetReturnsTrueForaAddedUrl) {
    CLIHandler handler;
    handler.loadOrInitializeBloomFilter("8 1");
    Server server(8888, &handler);
    server.start();
    TestClient client("127.0.0.1", 8888);
    client.sendToServer("POST www.gettest2.com");
    EXPECT_EQ(client.sendToServer("GET www.gettest2.com"), "200 Ok\n\ntrue true");
}

// sending DELETE to server should return the 204 response
TEST(ServerCommandTests, DeleteUrlReturns204) {
    CLIHandler handler;
    handler.loadOrInitializeBloomFilter("8 1");
    Server server(8000, &handler);
    server.start();
    TestClient client("127.0.0.1", 8000);
    client.sendToServer("POST www.deletetest.com");
    EXPECT_EQ(client.sendToServer("DELETE www.deletetest.com"), "204 No Content\n");
}

// sending DELETE to server before adding any url should return 404
TEST(ServerCommandTests, DeleteUnknownUrlReturns404) {
    CLIHandler handler;
    handler.loadOrInitializeBloomFilter("8 1");
    Server server(5555, &handler);
    server.start();
    TestClient client("127.0.0.1", 5555);
    EXPECT_EQ(client.sendToServer("DELETE www.deletetest2.com"), "404 Not Found\n");
}

// sending POST, DELETE and then GET should return true false because delete doesnt change the bloom filter
TEST(ServerCommandTests, PostThenDeleteThenGetReturnsTrueFalse) {
    CLIHandler handler;
    handler.loadOrInitializeBloomFilter("8 1");
    Server server(6009, &handler);
    server.start();
    TestClient client("127.0.0.1", 6009);

    client.sendToServer("POST www.deletetest3.com");
    client.sendToServer("DELETE www.deletetest3.com");

    EXPECT_EQ(client.sendToServer("GET www.deletetest3.com"), "200 Ok\n\ntrue false\n"); // Bloom says yes, blacklist says no
}

// sending unknown command to server should return 400
TEST(ServerCommandTests, DeleteUnknownUrlReturns404) {
    CLIHandler handler;
    handler.loadOrInitializeBloomFilter("8 1");
    Server server(5555, &handler);
    server.start();
    TestClient client("127.0.0.1", 5555);
    EXPECT_EQ(client.sendToServer("hello world"), "400 Bad Request\n");
}

// sending invalid command to server should return 400
TEST(ServerCommandTests, PostInvalidCommand) {
    CLIHandler handler;
    handler.loadOrInitializeBloomFilter("8 1");
    Server server(5555, &handler);
    server.start();
    TestClient client("127.0.0.1", 5555);
    EXPECT_EQ(client.sendToServer("GET www.invalid.com invalid"), "400 Bad Request\n");
}

// -------------------- Continuity Tests --------------------
// adding a url, closing the server and then reopening it and checking that url should return true
TEST(ServerContinuityTests, KeepsUrlBetweenRuns) {
    CLIHandler handler;
    handler.loadOrInitializeBloomFilter("8 1");
    Server server(5555, &handler);
    server.start();
    TestClient client("127.0.0.1", 5555);
    client.sendToServer("POST www.continuitytest.com");
    server.stop();
    server.start();
    EXPECT_EQ(client.sendToServer("GET www.continuitytest.com"), "200 Ok\n\ntrue true");
}