const express = require('express');
const router  = express.Router();
const TCP     = require('../utils/TCPclient');

/**
 * POST /api/config
 * Initialize Bloom Filter server with bitArraySize and hashFuncs.
 */
router.post('/', async (req, res) => {
  const { bitArraySize, hashFuncs } = req.body;
  if (
    typeof bitArraySize !== 'number' ||
    !Array.isArray(hashFuncs) ||
    hashFuncs.length === 0 ||
    !hashFuncs.every(h => typeof h === 'string' && h.trim())
  ) {
    return res.status(400).json({ error: 'Invalid configuration payload' });
  }
  const line = [bitArraySize, ...hashFuncs].join(' ');
  try {
    await TCP.initTCP(line);
    return res.status(200).json({ message: 'Config line sent to TCP server' });
  } catch (err) {
    console.error('[ConfigRoute] initTCP error:', err.message);
    return res.status(400).json({ error: 'Failed to initialize Bloom Filter' });
  }
});

module.exports = router;
