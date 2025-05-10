#include <gtest/gtest.h>
#include "../src/server/Server.h"  // or your actual TCPServer header when it exists
#include <fstream>
#include <thread>
#include <chrono>


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
            if (send(sock, cmd.c_str(), cmd.size(), 0) < 0)
                throw std::runtime_error("Send failed");
            
            // create a buffer array to save the server's response
            char buffer[4096];
            int expected_data_len = sizeof(buffer);
            int read_bytes = recv(sock, buffer, expected_data_len, 0);
            // if nothing is received or the connection closed throw error
            if (received <= 0)
                throw std::runtime_error("Receive failed or connection closed");
    
            buffer[received] = '\0';
            return std::string(buffer);
        }
    
    private:
        int sock;
    };
       

// -------------------- Sanity Tests --------------------
TEST(ServerSanityTest, StartsSuccessfully) {
    Server server(8080, false);
    EXPECT_NO_THROW(server.start());
    server.stop();
}

TEST(ServerSanityTest, PostThenGetReturnsTrueTrue) {
    sendCommandToServer("POST www.example.com");
    std::string response = sendCommandToServer("GET www.example.com");
    EXPECT_EQ(response, "200 Ok\ntrue true");
}

TEST(ServerSanityTest, PostThenDeleteReturnsNoContent) {
    sendCommandToServer("POST www.delete.com");
    std::string delResponse = sendCommandToServer("DELETE www.delete.com");
    EXPECT_EQ(delResponse, "204 No Content");
}

// -------------------- Negative Tests --------------------
TEST(ServerNegativeTest, InvalidCommandReturnsBadRequest) {
    std::string response = sendCommandToServer("FOO www.example.com");
    EXPECT_EQ(response, "400 Bad Request");
}

TEST(ServerNegativeTest, MissingUrlReturnsBadRequest) {
    std::string response = sendCommandToServer("GET");
    EXPECT_EQ(response, "400 Bad Request");
}

TEST(ServerNegativeTest, DeleteNonexistentReturns404) {
    std::string response = sendCommandToServer("DELETE www.ghost.com");
    EXPECT_EQ(response, "404 Not Found");
}

// -------------------- Boundary Tests --------------------
TEST(ServerBoundaryTest, PostWithVeryLongUrl) {
    std::string longUrl(2048, 'a');
    std::string response = sendCommandToServer("POST http://" + longUrl + ".com");
    EXPECT_EQ(response.substr(0, 3), "201"); // Check if still accepted
}

// -------------------- Functional Tests --------------------
TEST(ServerFunctionalTest, PersistenceAcrossRestarts) {
    sendCommandToServer("POST www.persist.com");
    // simulate restart: stop/start server (skipped here)
    std::string response = sendCommandToServer("GET www.persist.com");
    EXPECT_EQ(response, "200 Ok\ntrue true");
}

TEST(ServerFunctionalTest, FalsePositiveHandledCorrectly) {
    std::string response = sendCommandToServer("GET www.randomfalse.com");
    EXPECT_EQ(response.substr(0, 8), "200 Ok\n");
}

// -------------------- Integration Tests --------------------
TEST(ServerIntegrationTest, FullAddCheckDeleteCycle) {
    sendCommandToServer("POST www.cycle.com");
    EXPECT_EQ(sendCommandToServer("GET www.cycle.com"), "200 Ok\ntrue true");
    EXPECT_EQ(sendCommandToServer("DELETE www.cycle.com"), "204 No Content");
    EXPECT_EQ(sendCommandToServer("GET www.cycle.com"), "404 Not Found");
}

// Main entry point for the tests
int main(int argc, char **argv) {
    ::testing::InitGoogleTest(&argc, argv);
    return RUN_ALL_TESTS();
}
