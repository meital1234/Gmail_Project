const Blacklist = require('../models/blacklist');

// POST /api/blacklist
exports.addUrlToBlacklist = async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  const ok = await Blacklist.addUrl(url);
  if (ok) {
    // created a new blacklist entry & tell client where to find
    return res
      .status(201)
      .location(`/api/blacklist/${encodeURIComponent(url)}`)
      .end();
  } else { // error in TCP layer
    return res
      .status(400)
      .json({ error: 'Failed to add URL to blacklist' });
  }
};

// DELETE /api/blacklist/:id
exports.deleteUrlFromBlacklist = async (req, res) => {
  const url = decodeURIComponent(req.params.id);
  const ok  = await Blacklist.deleteUrl(url);
  if (ok) {
    // removed successfully
    return res
    .status(204)
    .end();
  } else {
    // TCP server returned 'Not Found'
    return res
    .status(404)
    .json({ error: 'URL not found' });
  }
};
