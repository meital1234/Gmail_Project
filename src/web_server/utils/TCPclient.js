
// single & persistent TCP client for BF server
// call initTCP once & then use sendCommand to send GET/POST/DELETE
// if needed it can close connection to shut socket down
const net = require('net');

// read TCP host & port from env vars
// In Docker Compose -> TCP_HOST=server & TCP_PORT=8080 so client connects to server container
const TCP_HOST = process.env.TCP_HOST || '127.0.0.1';
const TCP_PORT = parseInt(process.env.TCP_PORT || '8080', 10);
const DEFAULT_TIMEOUT_MS = 5000;

let clientSocket = null;  // net.Socket instance once connected
let responseBuffer = '';  // accumulates incoming data until a full response is detected
let pendingResolve = null;  // holds resolve for sendCommand Promise
let pendingReject = null;  // holds reject for sendCommand Promise
let configSent = false;  // tracks if initTCP sent configLine

// initialize TCP connection & send config line once.
function initTCP(configLine) {
  return new Promise((resolve, reject) => {
    if (clientSocket) {
      // already initialized & sent configLine
      return resolve();
    }

    // Create a new TCP socket
    clientSocket = new net.Socket();
    responseBuffer = '';

    // try to connect BF server
    clientSocket.connect(TCP_PORT, TCP_HOST, () => {
      // once connected -> send configLine once
      const line = configLine.trim();
      clientSocket.write(line + '\n');
      configSent = true;
      resolve();
    });

    // handle connection errors
    clientSocket.once('error', (err) => {
      clientSocket.destroy();
      clientSocket = null;
      reject(err);
    });

    // handle data coming from server
    clientSocket.on('data', (data) => {
      responseBuffer += data.toString();

      // detect end-of-response -> "\n\n" for GET | "Bad Request" | single line codestatus for 201\204
      if (
        responseBuffer.includes('\n\n') ||
        responseBuffer.includes('Bad Request') ||
        /^\d{3}\s/.test(responseBuffer)
      ) {
        // if a sendCommand is await a response -> resolve with full trimmed text
        if (pendingResolve) {
          const full = responseBuffer.trim();
          pendingResolve(full);
          pendingResolve = null;
          pendingReject = null;
          responseBuffer = '';
        }
      }
    });

    // handle socket close
    clientSocket.on('close', () => {
      clientSocket = null;
      if (pendingReject) {
        // if command was pending when socket was closet suprsingly -> reject
        pendingReject(new Error('Connection closed by server'));
        pendingResolve = null;
        pendingReject = null;
      }
    });
  });
}

// send 1 command over existing TCP connection
function sendCommand(commandStr) {
  return new Promise((resolve, reject) => {
    if (!clientSocket) {
      return reject(new Error('TCP client not initialized. Call initTCP() first.'));
    }
    if (pendingResolve) {
      return reject(new Error('Previous command still pending.'));
    }
    
    // store resolve/reject so that on data reception we can pass the response back
    pendingResolve = resolve;
    pendingReject = reject;
    responseBuffer = '';

    // send the command plus newline
    clientSocket.write(commandStr.trim() + '\n');

    // set a timeout in case server never responds
    setTimeout(() => {
      if (pendingReject) {
        pendingReject(new Error('TCP request timed out'));
        pendingResolve = null;
        pendingReject = null;
      }
    }, DEFAULT_TIMEOUT_MS);
  });
}

async function checkLinks(links) {
  for (const link of links) {
    const response = await sendCommand(`GET ${link}`);
    if (response.includes('true true')) {
      return true; // at least one blacklisted
    }
  }
  return false; // all clean
}

// close TCP connection
function closeConnection() {
  if (clientSocket) {
    clientSocket.end();
    clientSocket = null;
  }
}

module.exports = {
  initTCP,
  sendCommand,
  checkLinks,
  closeConnection,
};
