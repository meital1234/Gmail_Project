const TCP = require('../utils/TCPclient');

/**
 * Add a URL to the distributed Bloom-filter.
 */
async function addUrl(url) {
  if (!url || typeof url !== 'string' || !url.trim()) {
    throw new Error('URL is required');
  }
  const raw  = await TCP.sendCommand(`POST ${url}`);
  const code = Number(raw.match(/^\d{3}/)?.[0] || 0);
  if (code !== 201) throw new Error('Failed to add URL to blacklist');
}

/**
 * Remove a URL from the distributed Bloom-filter.
 */
async function deleteUrl(url) {
  if (!url || typeof url !== 'string' || !url.trim()) {
    throw new Error('URL is required');
  }
  const raw  = await TCP.sendCommand(`DELETE ${url}`);
  const code = Number(raw.match(/^\d{3}/)?.[0] || 0);
  if (code === 404) throw new Error('URL not found');
  if (code !== 204) throw new Error('Failed to delete URL from blacklist');
}

/**
 * Check membership of a URL in the Bloom-filter.
 * Returns true if black-listed.
 */
async function isBlacklisted(url) {
  if (!url || typeof url !== 'string') return false;
  const raw  = await TCP.sendCommand(`GET ${url}`);
  const code = Number(raw.match(/^\d{3}/)?.[0] || 0);
  return code === 200;
}

module.exports = { addUrl, deleteUrl, isBlacklisted };
