const blacklistService = require('../services/blacklist');
const { getAuthenticatedUser } = require('../utils/auth');

/**
 * POST /api/blacklist
 * Add a URL to the Bloom-filter.
 */
exports.addUrlToBlacklist = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req, res);
    if (!user) return;

    const { url } = req.body;
    if (!url || typeof url !== 'string' || !url.trim()) {
      return res.status(400).json({ error: 'URL is required' });
    }

    await blacklistService.addUrl(url);
    res
      .status(201)
      .location(`/api/blacklist/${encodeURIComponent(url)}`)
      .end();
  } catch (err) {
    console.error('[BlacklistController.addUrlToBlacklist]', err);
    res.status(err.message==='Failed to add URL to blacklist' ? 400 : 500)
       .json({ error: err.message });
  }
};

/**
 * DELETE /api/blacklist/:id
 * Remove a URL from the Bloom-filter.
 */
exports.deleteUrlFromBlacklist = async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req, res);
    if (!user) return;

    const url = decodeURIComponent(req.params.id);
    if (!url.trim()) {
      return res.status(400).json({ error: 'Invalid URL parameter' });
    }

    await blacklistService.deleteUrl(url);
    res.sendStatus(204);
  } catch (err) {
    console.error('[BlacklistController.deleteUrlFromBlacklist]', err);
    res.status(err.message==='URL not found' ? 404 : 500)
       .json({ error: err.message });
  }
};
