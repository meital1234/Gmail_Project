const net = require('net');
const TCP_HOST = '127.0.0.1';  // IP for hosting connection
const TCP_PORT = 8080;  // port for listening
const DEFAULT_TIMEOUT_MS = 3000;

// helper function of a regex that looks for the http status code at the begining of response string
// as the http status code is built from 3 digits
function extractStatusCode(response) {
  return Number( response.match(/^\d{3}/)?.[0] || 0 );
}

// opens TCP socket connection to server
// sends GET command via TCP & returns answer
// closes connection
function sendTCPCommand(command) {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    let response = '';

    // start timeout timer
    const timer = setTimeout(() => {
      client.destroy();  // force to close socket
      reject(new Error('TCP request timed out'));
    }, DEFAULT_TIMEOUT_MS);
    
    // clean up timer on socket close
    client.once('close', () => {
      clearTimeout(timer);
    });

    // handle errors like connect & send errors.
    client.once('error', err => {
      clearTimeout(timer);
      client.destroy();
      reject(err);
    });

    // handle incoming data
    client.on('data', (data) => {
      response += data.toString();
      // detect end of response as each status line is 1 line except GET
      if (response.includes('\n\n') || response.includes('Bad Request')) {
        clearTimeout(timer);
        client.destroy(); // closes connection after recieving answer
        resolve(response.trim());
      }
    });

    // connect to TCP & write command
    client.connect(TCP_PORT, TCP_HOST, () => {
      client.write(command + '\n');
    });
  });
}

// this function recieves the links & checks them one by one with GET
// when server returns '200' & 'true true' - return true as well, otherwise false
async function checkLinksWithTCP(links) {
  for (const url of links) {
    const response = await sendTCPCommand(`GET ${url}`);
    const code = extractStatusCode(response);
    if (code === 200) {
      // expect response to be "true true"
      const bool = response.split('\n\n')[1]?.trim();
      if (bool === 'true true') {
        return true;
      }
    }
  }
  return false;
}

// this function adds url to blacklist one by one with POST & returns true if server returns "201 created"
async function addToBlacklist(url) {
  try {
    // expect response to be "201 Created"
    const response = await sendTCPCommand(`POST ${url}`);
    return extractStatusCode(response) === 201;
  } catch (err) {
    console.error(`[TCP ERROR] adding "${url}":`, err.message);
    return false;
  }
}

module.exports = { 
  extractStatusCode,
  sendTCPCommand,
  checkLinksWithTCP,
  addToBlacklist
};
