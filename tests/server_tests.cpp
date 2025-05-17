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
#include <thread>
#include <chrono>

// what do i need to test the server for?
// socket connections tests (keeps connection alive)
// correct response to GET/POST/DELETE commands sent from client

// so, i want to implement a client class in cpp used for the tests, each instance of this class would connect 
// to my server's socket in order to preform all the tests.
class TestClient {
public:
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

    // Sends a line to server and returns the response
    std::string sendToServer(const std::string& cmd, bool waitForResponse = true) {
        std::string fullCmd = cmd + "\n";
        // std::cerr << "[Client] Sending: '" << fullCmd << "'" << std::endl;

        if (send(sock, fullCmd.c_str(), fullCmd.size(), 0) < 0)
            throw std::runtime_error("Send failed");

        if (!waitForResponse) return "";
        char buffer[4096];
        int received = recv(sock, buffer, sizeof(buffer) - 1, 0);
        if (received <= 0) {
            // std::cerr << "[Client] Server closed connection or recv error.\n";
            return "";
        }

        buffer[received] = '\0';
        std::string response(buffer);
        // std::cerr << "[Client] Received: '" << response << "'\n";
        return response;
    }
    void shutdownAndClose() {
        if (sock >= 0) {
            shutdown(sock, SHUT_RDWR);  // gracefully signal EOF
            close(sock);
            sock = -1;
        }
    }


private:
    int sock;
};

void runServerInThread(Server* server) {
    server->start();  // blocking function
}

void sleepBriefly() {
    std::this_thread::sleep_for(std::chrono::milliseconds(50));  // wait for server to start
}


// -------------------- Command Tests --------------------
// added one test for each command the server should know how to handle
// sending POST to server should return the 201 response
TEST(ServerCommandTests, PostAddsUrl) {
    CLIHandler handler;
    Server server(8080, &handler);
    
    std::thread serverThread(runServerInThread, &server);  // run in background
    sleepBriefly();  // let server bind

    TestClient client("127.0.0.1", 8080);
    client.sendToServer("8 1", false);
    EXPECT_EQ(client.sendToServer("POST www.posttest.com"), "201 Created\n");
    client.shutdownAndClose();
    server.stop();  // important!
    if (serverThread.joinable()) serverThread.join();
}

// sending GET to server before adding any url should return false
TEST(ServerCommandTests, GetReturnsFalseForNewUrl) {
    CLIHandler handler;
    Server server(8888, &handler);
    
    std::thread serverThread(runServerInThread, &server);  // run in background
    sleepBriefly();  // let server bind

    TestClient client("127.0.0.1", 8888);
    client.sendToServer("8 1", false);
    std::string response = client.sendToServer("GET www.gettest.com");
    EXPECT_TRUE(response == "200 Ok\n\nfalse\n");
    client.shutdownAndClose();
    server.stop();  // important!
    if (serverThread.joinable()) serverThread.join();
}

// sending GET to server after adding the url should return true
TEST(ServerCommandTests, GetReturnsTrueForaAddedUrl) {
    CLIHandler handler;
    Server server(8888, &handler);
    
    std::thread serverThread(runServerInThread, &server);  // run in background
    sleepBriefly();  // let server bind

    TestClient client("127.0.0.1", 8888);
    client.sendToServer("8 1", false);
    client.sendToServer("POST www.gettest2.com");
    EXPECT_EQ(client.sendToServer("GET www.gettest2.com"), "200 Ok\n\ntrue true\n");
    client.shutdownAndClose();
    server.stop();  // important!
    if (serverThread.joinable()) serverThread.join();
}

// sending DELETE to server should return the 204 response
TEST(ServerCommandTests, DeleteUrlReturns204) {
    CLIHandler handler;
    Server server(8000, &handler);
    
    std::thread serverThread(runServerInThread, &server);  // run in background
    sleepBriefly();  // let server bind

    TestClient client("127.0.0.1", 8000);
    client.sendToServer("8 1", false);
    client.sendToServer("POST www.deletetest.com");
    EXPECT_EQ(client.sendToServer("DELETE www.deletetest.com"), "204 No Content\n");
    client.shutdownAndClose();
    server.stop();  // important!
    if (serverThread.joinable()) serverThread.join();
}

// sending DELETE to server before adding any url should return 404
TEST(ServerCommandTests, DeleteUnknownUrlReturns404) {
    CLIHandler handler;
    Server server(5555, &handler);

    std::thread serverThread(runServerInThread, &server);  // run in background
    sleepBriefly();  // let server bind

    TestClient client("127.0.0.1", 5555);
    client.sendToServer("8 1", false);
    EXPECT_EQ(client.sendToServer("DELETE www.deletetest2.com"), "404 Not Found\n");
    client.shutdownAndClose();
    server.stop();  // important!
    if (serverThread.joinable()) serverThread.join();
}

// sending POST, DELETE and then GET should return true false because delete doesnt change the bloom filter
TEST(ServerCommandTests, PostThenDeleteThenGetReturnsTrueFalse) {
    CLIHandler handler;
    Server server(6009, &handler);

    std::thread serverThread(runServerInThread, &server);  // run in background
    sleepBriefly();  // let server bind

    TestClient client("127.0.0.1", 6009);
    client.sendToServer("8 1", false);
    client.sendToServer("POST www.deletetest3.com");
    client.sendToServer("DELETE www.deletetest3.com");

    EXPECT_EQ(client.sendToServer("GET www.deletetest3.com"), "200 Ok\n\ntrue false\n"); // Bloom says yes, blacklist says no
    client.shutdownAndClose();
    server.stop();  // important!
    if (serverThread.joinable()) serverThread.join();
}

// sending unknown command to server should return 400
TEST(ServerCommandTests, DeleteUnknownUrlReturns400) {
    CLIHandler handler;
    Server server(5555, &handler);

    std::thread serverThread(runServerInThread, &server);  // run in background
    sleepBriefly();  // let server bind

    TestClient client("127.0.0.1", 5555);
    client.sendToServer("8 1", false);
    EXPECT_EQ(client.sendToServer("hello world"), "400 Bad Request\n");
    client.shutdownAndClose();

    server.stop();  // important!
    if (serverThread.joinable()) serverThread.join();
}

// sending invalid command to server should return 400
TEST(ServerCommandTests, PostInvalidCommand) {
    CLIHandler handler;
    Server server(5555, &handler);
    
    std::thread serverThread(runServerInThread, &server);  // run in background
    sleepBriefly();  // let server bind

    TestClient client("127.0.0.1", 5555);
    client.sendToServer("8 1", false);
    EXPECT_EQ(client.sendToServer("GET www.invalid.com invalid"), "400 Bad Request\n");
    client.shutdownAndClose();

    server.stop();  // important!
    if (serverThread.joinable()) serverThread.join();
}

// -------------------- Continuity Tests --------------------
// adding a url, closing the server and then reopening it and checking that url should return true
TEST(ServerContinuityTests, KeepsUrlBetweenRuns) {
    {
        CLIHandler handler;
        Server server(5555, &handler);

        std::thread serverThread1(runServerInThread, &server);
        sleepBriefly();

        TestClient client("127.0.0.1", 5555);
        client.sendToServer("8 1", false);
        client.sendToServer("POST www.continuitytest.com");
        client.shutdownAndClose();

        server.stop();
        if (serverThread1.joinable()) serverThread1.join();
    }

    {
        CLIHandler handler2;
        Server server2(5555, &handler2);

        std::thread serverThread2(runServerInThread, &server2);
        sleepBriefly();

        TestClient client("127.0.0.1", 5555);
        client.sendToServer("8 1", false);  // config line
        EXPECT_EQ(client.sendToServer("GET www.continuitytest.com"), "200 Ok\n\ntrue true\n");
        client.shutdownAndClose();

        server2.stop();
        if (serverThread2.joinable()) serverThread2.join();
    }
}
