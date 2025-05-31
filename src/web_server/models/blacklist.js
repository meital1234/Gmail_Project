const { sendTCPCommand } = require('../utils/TCPclientconnection');

//  send POST command to TCP to ADD URL to blacklist
async function addUrl(url) {
  const cmd = `POST ${url}`;
  try {
    const raw = await sendTCPCommand(cmd);
    const code = Number(raw.match(/^\d{3}/)?.[0] || 0);
    return code === 201;
  } catch (err) {
    console.error(`[BlacklistService] failed to add "${url}":`, err.message);
    return false;
  }
}

// Send DELETE command to TCP to DELETE URL from blacklist
async function deleteUrl(url) {
  const cmd = `DELETE ${url}`;
  try {
    const raw = await sendTCPCommand(cmd);
    const code = Number(raw.match(/^\d{3}/)?.[0] || 0);
    return code === 204;
  } catch (err) {
    console.error(`[BlacklistService] failed to delete "${url}":`, err.message);
    return false;
  }
}

module.exports = {
  addUrl,
  deleteUrl,
};
