#include "server/Server.h"
#include "CLIhandler/CLI_handler.h"

int main() {
    CLIHandler handler;
    Server server(8080, &handler);
    server.start();
    return 0;
}
