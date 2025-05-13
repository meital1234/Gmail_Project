#include "../src/server/Server.h"
#include "../src/CLIhandler/CLI_handler.h"

int main() {
    CLIHandler handler;
    Server server(8080, &handler);
    server.start();
    return 0;
}
