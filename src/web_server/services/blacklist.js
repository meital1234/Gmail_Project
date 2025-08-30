// const TCP = require('../utils/TCPclient');

// /**
//  * Add a URL to the distributed Bloom-filter.
//  */
// async function addUrl(url) {
//   if (!url || typeof url !== 'string' || !url.trim()) {
//     throw new Error('URL is required');
//   }
//   const raw  = await TCP.sendCommand(`POST ${url}`);
//   const code = Number(raw.match(/^\d{3}/)?.[0] || 0);
//   if (code !== 201) throw new Error('Failed to add URL to blacklist');
// }

// /**
//  * Remove a URL from the distributed Bloom-filter.
//  */
// async function deleteUrl(url) {
//   if (!url || typeof url !== 'string' || !url.trim()) {
//     throw new Error('URL is required');
//   }
//   const raw  = await TCP.sendCommand(`DELETE ${url}`);
//   const code = Number(raw.match(/^\d{3}/)?.[0] || 0);
//   if (code === 404) throw new Error('URL not found');
//   if (code !== 204) throw new Error('Failed to delete URL from blacklist');
// }

// /**
//  * Check membership of a URL in the Bloom-filter.
//  * Returns true if black-listed.
//  */
// async function isBlacklisted(url) {
//   if (!url || typeof url !== 'string') return false;
//   const raw  = await TCP.sendCommand(`GET ${url}`);
//   const code = Number(raw.match(/^\d{3}/)?.[0] || 0);
//   return code === 200;
// }

// module.exports = { addUrl, deleteUrl, isBlacklisted };

// services/blacklist.js
const TCP = require('../utils/TCPclient');
const BlacklistUrl = require('../models/blacklist');
const { extractLinks } = require('../utils/linkExtraction');

function normalizeOne(url) {
  const [u] = extractLinks(String(url));
  return u || String(url).trim().toLowerCase();
}

async function bloomAdd(u) {
  const raw = await TCP.sendCommand(`POST ${u}`);
  const code = Number(raw.match(/^\d{3}/)?.[0] || 0);
  if (code !== 201) throw new Error('Bloom add failed');
}
async function bloomMaybe(u) {
  const raw = await TCP.sendCommand(`GET ${u}`);
  const code = Number(raw.match(/^\d{3}/)?.[0] || 0);
  return code === 200; // "אולי" – נאמת מול DB
}

async function addUrl(url) {
  const u = normalizeOne(url);
  await BlacklistUrl.updateOne({ url: u }, { $setOnInsert: { url: u } }, { upsert: true });
  await bloomAdd(u);
  return u;
}

async function deleteUrl(url) {
  const u = normalizeOne(url);
  await BlacklistUrl.deleteOne({ url: u });
  try { await TCP.sendCommand(`DELETE ${u}`); } catch {}
}

async function isBlacklisted(url) {
  const u = normalizeOne(url);
  const maybe = await bloomMaybe(u);
  if (!maybe) return false;                     // Bloom שלילי => בטוח לא
  const exists = await BlacklistUrl.exists({ url: u });
  return !!exists;                              // אמת רק אם באמת ברשימת DB
}

module.exports = { addUrl, deleteUrl, isBlacklisted };
