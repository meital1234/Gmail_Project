// const TCP = require('../utils/TCPclient');

// // send POST command to TCP to ADD URL to blacklist
// async function addUrl(url) {
//   if (typeof url !== 'string' || url.trim() === '') {
//     return false;
//   }
//   // assume TCP.init already called via /api/config.
//   // if not, sendCommand will reject
//   try {
//     const responseLine = await TCP.sendCommand(`POST ${url}`);
//     console.log(`[BlacklistModel] addUrl("${url}") response:`, responseLine);
//     const code = Number(responseLine.match(/^\d{3}/)?.[0] || 0);
//     return code === 201;
//   } catch (err) {
//     console.error(`[BlacklistModel] addUrl("${url}") error:`, err.message);
//     return false;
//   }
// }

// // send DELETE command to TCP to DELETE URL from blacklist
// async function deleteUrl(url) {
//   if (typeof url !== 'string' || url.trim() === '') {
//     return false;
//   }
//   try {
//     const responseLine = await TCP.sendCommand(`DELETE ${url}`);
//     const code = Number(responseLine.match(/^\d{3}/)?.[0] || 0);
//     return code === 204;
//   } catch (err) {
//     console.error(`[BlacklistModel] deleteUrl("${url}") error:`, err.message);
//     return false;
//   }
// }

// async function isBlacklisted(url) {
//   if (typeof url !== 'string' || !url.trim()) return false;
//   try {
//     // sent GET to check if wxists
//     const responseLine = await TCP.sendCommand(`GET ${url}`);
//     console.log(`[BlacklistModel] isBlacklisted("${url}") response:`, responseLine);
//     const lines = responseLine.split(/\r?\n/);
//     const statusLine = lines[0] || '';
//     const code = Number(statusLine.match(/^\d{3}/)?.[0] || 0);

//     return code === 200 && lines[2]?.trim() === 'true true';  // explicitly check that second line says "true"

//   } catch (err) {
//     console.error(`[BlacklistModel] isBlacklisted("${url}") error:`, err.message);
//     throw new Error("TCP not initialized");
//   }
// }

// module.exports = {
//   addUrl,
//   deleteUrl,
//   isBlacklisted
// };
// models/BlacklistUrl.js
const mongoose = require('mongoose');
const BlacklistUrlSchema = new mongoose.Schema({
  url: { type: String, required: true, trim: true, lowercase: true, unique: true },
  createdAt: { type: Date, default: Date.now }
}, { collection: 'blacklist_urls' });
BlacklistUrlSchema.index({ url: 1 }, { unique: true });
module.exports = mongoose.model('BlacklistUrl', BlacklistUrlSchema);
