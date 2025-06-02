const express = require('express');
const router = express.Router();
const TCP = require('../utils/TCPclient');

// POST /api/config
// sends configLine to TCP server
router.post('/', async (req, res) => {
  // extract from request body
  const { bitArraySize, hashFuncs } = req.body;
  // validate bitArraySize is number & hashFuncs is not an empty array
  if (
    typeof bitArraySize !== 'number' ||
    !Array.isArray(hashFuncs) ||
    hashFuncs.length === 0 ||
    !hashFuncs.every(h => typeof h === 'string' && h.trim())
  ) {
    // if validation fails -> return 400 Bad Request
    return res.status(400).json({ error: 'Invalid configuration payload' });
  }

  // build a single line config string to send via TCP
  // by the format of: bitArraySize - hashFunc1 - hashFunc2 - .....
  const line = [bitArraySize, ...hashFuncs].join(' ');
  try {
    // call TCP.intTCP - opens TCP socket to BF server & sends configLine once through socket
    // resolves only after assuring connection succeed
    await TCP.initTCP(line);
    return res.status(200).json({ message: 'Config line sent to TCP server' });
  } catch (err) {
    // if any error occures -> return 400 Bad Request
    console.error('[ConfigRoute] initTCP error:', err.message);
    return res.status(400).json({ error: 'Failed to initialize Bloom Filter' });
  }
});

module.exports = router;
