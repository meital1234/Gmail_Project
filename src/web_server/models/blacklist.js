const TCP = require('../utils/configLineTCP');

// send POST command to TCP to ADD URL to blacklist
async function addUrl(url) {
  if (typeof url !== 'string' || url.trim() === '') {
    return false;
  }
  // assume TCP.init already called via /api/config.
  // if not, sendCommand will reject
  try {
    const responseLine = await TCP.sendCommand(`POST ${url}`);
    const code = Number(responseLine.match(/^\d{3}/)?.[0] || 0);
    return code === 201;
  } catch (err) {
    console.error(`[BlacklistModel] addUrl("${url}") error:`, err.message);
    return false;
  }
}

// send DELETE command to TCP to DELETE URL from blacklist
async function deleteUrl(url) {
  if (typeof url !== 'string' || url.trim() === '') {
    return false;
  }
  try {
    const responseLine = await TCP.sendCommand(`DELETE ${url}`);
    const code = Number(responseLine.match(/^\d{3}/)?.[0] || 0);
    return code === 204;
  } catch (err) {
    console.error(`[BlacklistModel] deleteUrl("${url}") error:`, err.message);
    return false;
  }
}

async function isBlacklisted(url) {
  if (typeof url !== 'string' || !url.trim()) return false;
  try {
    // sent GET to check if wxists
    const responseLine = await TCP.sendCommand(`GET ${url}`);
    const code = Number(responseLine.match(/^\d{3}/)?.[0] || 0);
    return code === 200;  // if exists return 200 OK
  } catch (err) {
    console.error(`[BlacklistModel] isBlacklisted("${url}") error:`, err.message);
    return false;
  }
}

module.exports = {
  addUrl,
  deleteUrl,
  isBlacklisted
};
