// src/web_server/controllers/blacklist.js

const TCP = require('../utils/TCPclient');

// POST /api/blacklist
exports.addUrlToBlacklist = async (req, res) => {
  try {
    const { url } = req.body;
    // validate that URL is not an empty string
    if (!url || typeof url !== 'string' || url.trim() === '') {
      return res.status(400).json({ error: 'URL is required' });
    }

    
    // send  POST to BF server
    const rawResponse = await TCP.sendCommand(`POST ${url}`);
    const code = Number(rawResponse.match(/^\d{3}/)?.[0] || 0);
    if (code === 201) {
      // if BF server returns 201 Created -> respond with 201 and Location header
      return res
        .status(201)
        .location(`/api/blacklist/${encodeURIComponent(url)}`)
        .end();
    } else {
      // any other codestatus will be dealt as 400 Bad Request
      return res.status(400).json({ error: 'Failed to add URL to blacklist' });
    }
  } catch (err) {
    console.error('[BlacklistController] addUrlToBlacklist error:', err.message);
    return res.status(400).json({ error: 'Internal server error' });
  }
};

// DELETE /api/blacklist/:id
exports.deleteUrlFromBlacklist = async (req, res) => {
  try {
    const url = decodeURIComponent(req.params.id);
    // validate URL parameter is not an empty string
    if (!url || typeof url !== 'string' || url.trim() === '') {
      return res.status(400).json({ error: 'Invalid URL parameter' });
    }

    // send DELETE command to BF server
    const rawResponse = await TCP.sendCommand(`DELETE ${url}`);
    const code = Number(rawResponse.match(/^\d{3}/)?.[0] || 0);
    if (code === 204) {
      // if BF server returns 204 -> respond accordingly with 204
      return res.status(204).end();
    } else if (code === 404) {
      // if BF server returns 404 -> respond accordingly with 404
      return res.status(404).json({ error: 'URL not found' });
    } else {
      // any other codestatus will be dealt as 400 Bad Request
      return res.status(400).json({ error: 'Failed to delete URL from blacklist' });
    }
  } catch (err) {
    console.error('[BlacklistController] deleteUrlFromBlacklist error:', err.message);
    return res.status(400).json({ error: 'server error' });
  }
};
