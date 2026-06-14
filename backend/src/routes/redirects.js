const express = require('express');
const router = express.Router();
const UAParser = require('ua-parser-js');
const ShortUrl = require('../models/ShortUrl');
const VisitAnalytics = require('../models/VisitAnalytics');

// @desc    Redirect short code to original URL and track click
// @route   GET /r/:shortCode
// @access  Public
router.get('/:shortCode', async (req, res, next) => {
  try {
    const { shortCode } = req.params;

    // Find URL by shortCode or customAlias
    const shortUrl = await ShortUrl.findOne({
      $or: [{ shortCode: shortCode }, { customAlias: shortCode }]
    });

    if (!shortUrl) {
      return res.status(404).send('<h1>404 Not Found</h1><p>The shortened URL does not exist.</p>');
    }

    // Check expiration date
    if (shortUrl.expiresAt && new Date() > shortUrl.expiresAt) {
      return res.status(410).send('<h1>410 Gone</h1><p>This shortened URL has expired.</p>');
    }

    // Parse User-Agent
    const uaString = req.headers['user-agent'] || 'Unknown';
    const parser = new UAParser(uaString);
    const uaResult = parser.getResult();

    const browser = uaResult.browser.name || 'Unknown';
    const os = uaResult.os.name || 'Unknown';
    const deviceType = uaResult.device.type || 'Desktop';
    // Format device type
    const device = deviceType.charAt(0).toUpperCase() + deviceType.slice(1);

    // Get Referrer
    const referrerHeader = req.get('referrer') || req.get('referer') || '';
    let referrer = 'Direct';
    if (referrerHeader) {
      try {
        const urlObj = new URL(referrerHeader);
        referrer = urlObj.hostname || 'Direct';
      } catch (err) {
        referrer = 'Direct';
      }
    }

    // Anonymize IP
    let rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Anonymized';
    if (rawIp && rawIp !== 'Anonymized' && rawIp !== '::1') {
      const parts = rawIp.split(',');
      let firstIp = parts[0].trim();
      if (firstIp.includes('.')) {
        const ipParts = firstIp.split('.');
        if (ipParts.length === 4) {
          firstIp = `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}.xxx`;
        }
      } else if (firstIp.includes(':')) {
        const ipParts = firstIp.split(':');
        if (ipParts.length > 2) {
          firstIp = `${ipParts[0]}:${ipParts[1]}:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx`;
        }
      }
      rawIp = firstIp;
    } else if (rawIp === '::1' || rawIp === '127.0.0.1') {
      rawIp = 'localhost';
    }

    // Increment click count
    shortUrl.clicks = (shortUrl.clicks || 0) + 1;
    await shortUrl.save();

    // Log Visit Analytics
    await VisitAnalytics.create({
      shortUrl: shortUrl._id,
      userAgent: uaString.substring(0, 500),
      browser,
      os,
      device,
      referrer,
      ipAddress: rawIp
    });

    // Redirect
    return res.redirect(shortUrl.originalUrl);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
