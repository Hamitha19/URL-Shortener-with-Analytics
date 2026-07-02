const express = require('express');
const router = express.Router();
const validator = require('validator');
const os = require('os');
const ShortUrl = require('../models/ShortUrl');
const { protect } = require('../middleware/auth');

const getLocalIp = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
};

const localIp = getLocalIp();
const PORT = process.env.PORT || 5000;
const defaultBaseUrl = `http://${localIp}:${PORT}`;

const getBaseUrl = () => {
  let baseUrl = process.env.BASE_URL;
  if (!baseUrl) {
    if (process.env.NODE_ENV === 'production') {
      baseUrl = 'https://url-shortener-with-analytics-r4j8.onrender.com';
    } else {
      baseUrl = defaultBaseUrl;
    }
  }
  // If base URL is localhost/127.0.0.1, replace with the machine's local IP address
  // to allow mobile devices on the same network to scan the generated QR codes.
  if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
    const currentLocalIp = getLocalIp();
    if (currentLocalIp !== 'localhost') {
      baseUrl = baseUrl.replace('localhost', currentLocalIp).replace('127.0.0.1', currentLocalIp);
    }
  }
  return baseUrl;
};

// Helper to generate unique short code
const generateShortCode = async () => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let isUnique = false;
  let code = '';
  let attempts = 0;

  while (!isUnique && attempts < 10) {
    code = '';
    for (let i = 0; i < 7; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Check collision in database
    const existing = await ShortUrl.findOne({
      $or: [{ shortCode: code }, { customAlias: code }]
    });
    if (!existing) {
      isUnique = true;
    }
    attempts++;
  }

  if (!isUnique) {
    throw new Error('Failed to generate a unique short code');
  }
  return code;
};

// Helper to sanitize and format URL
const formatUrl = (url) => {
  if (!/^https?:\/\//i.test(url)) {
    return `http://${url}`;
  }
  return url;
};

// @desc    Create a shortened URL
// @route   POST /api/urls/shorten
// @access  Public / Optional Private
router.post('/shorten', async (req, res, next) => {
  try {
    let { originalUrl, customAlias, title, expiresAt } = req.body;
    let userId = null;

    // Check if user is authenticated (optional protect style)
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      const jwt = require('jsonwebtoken');
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hackathon_secret_security_key_2026_antigravity');
        userId = decoded.id;
      } catch (err) {
        // Token invalid, treat as anonymous
      }
    }

    if (!originalUrl) {
      return res.status(400).json({ success: false, message: 'Please provide a destination URL' });
    }

    originalUrl = formatUrl(originalUrl.trim());

    // Validate URL format
    if (!validator.isURL(originalUrl, { require_tld: true, require_protocol: true })) {
      return res.status(400).json({ success: false, message: 'Please provide a valid destination URL (e.g. https://google.com)' });
    }

    // Handle custom alias
    let finalCode;
    if (customAlias && customAlias.trim() !== '') {
      const alias = customAlias.trim().toLowerCase();
      // Validate alias format (alphanumeric and dashes/underscores only)
      if (!/^[a-z0-9-_]+$/i.test(alias)) {
        return res.status(400).json({ success: false, message: 'Custom alias can only contain letters, numbers, dashes, and underscores' });
      }

      // Check for alias conflicts
      const conflict = await ShortUrl.findOne({
        $or: [{ shortCode: alias }, { customAlias: alias }]
      });
      if (conflict) {
        return res.status(400).json({ success: false, message: `The custom alias "${alias}" is already taken` });
      }
      finalCode = alias;
    } else {
      finalCode = await generateShortCode();
    }

    const newUrlData = {
      originalUrl,
      shortCode: finalCode,
      title: title && title.trim() !== '' ? title.trim() : originalUrl,
      user: userId,
      expiresAt: expiresAt ? new Date(expiresAt) : null
    };

    if (customAlias && customAlias.trim() !== '') {
      newUrlData.customAlias = finalCode;
    }

    const shortUrl = await ShortUrl.create(newUrlData);

    res.status(201).json({
      success: true,
      data: shortUrl,
      shortUrl: `${getBaseUrl()}/r/${finalCode}`
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get all URLs for logged in user
// @route   GET /api/urls
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const urls = await ShortUrl.find({ user: req.user.id }).sort({ createdAt: -1 });
    const baseUrl = getBaseUrl();
    const data = urls.map(url => ({
      ...url.toObject(),
      shortUrl: `${baseUrl}/r/${url.shortCode}`
    }));
    res.status(200).json({ success: true, count: urls.length, data });
  } catch (error) {
    next(error);
  }
});

// @desc    Get detailed info of a single URL
// @route   GET /api/urls/:id
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const url = await ShortUrl.findById(req.params.id);

    if (!url) {
      return res.status(404).json({ success: false, message: 'Shortened URL not found' });
    }

    // Restrict access to the owning user
    if (url.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this URL details' });
    }

    const baseUrl = getBaseUrl();
    const urlData = {
      ...url.toObject(),
      shortUrl: `${baseUrl}/r/${url.shortCode}`
    };

    res.status(200).json({ success: true, data: urlData });
  } catch (error) {
    next(error);
  }
});

// @desc    Update a URL (Destination, Title, Expiry)
// @route   PUT /api/urls/:id
// @access  Private
router.put('/:id', protect, async (req, res, next) => {
  try {
    let { originalUrl, title, expiresAt, description } = req.body;
    let url = await ShortUrl.findById(req.params.id);

    if (!url) {
      return res.status(404).json({ success: false, message: 'Shortened URL not found' });
    }

    // Owner validation
    if (url.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this URL' });
    }

    const updateData = {};

    if (originalUrl) {
      originalUrl = formatUrl(originalUrl.trim());
      if (!validator.isURL(originalUrl, { require_tld: true, require_protocol: true })) {
        return res.status(400).json({ success: false, message: 'Please provide a valid destination URL' });
      }
      updateData.originalUrl = originalUrl;
    }

    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;

    url = await ShortUrl.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    const baseUrl = getBaseUrl();
    const urlData = {
      ...url.toObject(),
      shortUrl: `${baseUrl}/r/${url.shortCode}`
    };

    res.status(200).json({ success: true, data: urlData });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete a shortened URL
// @route   DELETE /api/urls/:id
// @access  Private
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const url = await ShortUrl.findById(req.params.id);

    if (!url) {
      return res.status(404).json({ success: false, message: 'Shortened URL not found' });
    }

    // Owner validation
    if (url.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this URL' });
    }

    // Delete associated analytics first
    const VisitAnalytics = require('../models/VisitAnalytics');
    await VisitAnalytics.deleteMany({ shortUrl: url._id });

    await url.deleteOne();

    res.status(200).json({ success: true, message: 'URL and its analytics deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// @desc    Bulk shorten URLs via batch list
// @route   POST /api/urls/bulk
// @access  Private
router.post('/bulk', protect, async (req, res, next) => {
  try {
    const { links } = req.body; // Array of { originalUrl, title, customAlias }

    if (!links || !Array.isArray(links) || links.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide a non-empty array of links to shorten' });
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < links.length; i++) {
      let { originalUrl, title, customAlias } = links[i];

      if (!originalUrl) {
        errors.push({ index: i, message: 'Missing original URL' });
        continue;
      }

      originalUrl = formatUrl(originalUrl.trim());
      if (!validator.isURL(originalUrl, { require_tld: true, require_protocol: true })) {
        errors.push({ index: i, originalUrl, message: 'Invalid URL format' });
        continue;
      }

      let finalCode;
      if (customAlias && customAlias.trim() !== '') {
        const alias = customAlias.trim().toLowerCase();
        if (!/^[a-z0-9-_]+$/i.test(alias)) {
          errors.push({ index: i, originalUrl, message: 'Custom alias contains invalid characters' });
          continue;
        }

        const conflict = await ShortUrl.findOne({
          $or: [{ shortCode: alias }, { customAlias: alias }]
        });
        if (conflict) {
          errors.push({ index: i, originalUrl, message: `Custom alias "${alias}" is already taken` });
          continue;
        }
        finalCode = alias;
      } else {
        try {
          finalCode = await generateShortCode();
        } catch (err) {
          errors.push({ index: i, originalUrl, message: 'Failed to generate unique short code' });
          continue;
        }
      }

      try {
        const newUrlData = {
          originalUrl,
          shortCode: finalCode,
          title: title && title.trim() !== '' ? title.trim() : originalUrl,
          user: req.user.id
        };

        if (customAlias && customAlias.trim() !== '') {
          newUrlData.customAlias = finalCode;
        }

        const shortUrl = await ShortUrl.create(newUrlData);
        results.push({
          index: i,
          originalUrl,
          shortCode: finalCode,
          shortUrl: `${getBaseUrl()}/r/${finalCode}`
        });
      } catch (err) {
        errors.push({ index: i, originalUrl, message: `Database error: ${err.message}` });
      }
    }

    res.status(200).json({
      success: true,
      processed: links.length,
      successCount: results.length,
      errorCount: errors.length,
      data: results,
      errors
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get detailed analytics for a URL
// @route   GET /api/urls/:id/analytics
// @access  Private
router.get('/:id/analytics', protect, async (req, res, next) => {
  try {
    const url = await ShortUrl.findById(req.params.id);

    if (!url) {
      return res.status(404).json({ success: false, message: 'Shortened URL not found' });
    }

    // Owner validation
    if (url.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to view analytics for this URL' });
    }

    const VisitAnalytics = require('../models/VisitAnalytics');
    const visits = await VisitAnalytics.find({ shortUrl: url._id }).sort({ timestamp: -1 });

    // JS-based aggregation
    const clicksByDate = {};
    const clicksByBrowser = {};
    const clicksByOS = {};
    const clicksByDevice = {};
    const clicksByReferrer = {};

    visits.forEach((visit) => {
      // Date format YYYY-MM-DD
      const dateStr = visit.timestamp.toISOString().split('T')[0];
      clicksByDate[dateStr] = (clicksByDate[dateStr] || 0) + 1;

      // Browser
      const browser = visit.browser || 'Unknown';
      clicksByBrowser[browser] = (clicksByBrowser[browser] || 0) + 1;

      // OS
      const os = visit.os || 'Unknown';
      clicksByOS[os] = (clicksByOS[os] || 0) + 1;

      // Device
      const device = visit.device || 'Desktop';
      clicksByDevice[device] = (clicksByDevice[device] || 0) + 1;

      // Referrer
      const referrer = visit.referrer || 'Direct';
      clicksByReferrer[referrer] = (clicksByReferrer[referrer] || 0) + 1;
    });

    const formatChartData = (obj) => {
      return Object.keys(obj).map((key) => ({ name: key, value: obj[key] }));
    };

    const timelineData = Object.keys(clicksByDate)
      .map((date) => ({ date, clicks: clicksByDate[date] }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Unique combination of IP, browser, and OS
    const uniqueIPs = new Set(visits.map((v) => `${v.ipAddress}_${v.browser}_${v.os}`));

    res.status(200).json({
      success: true,
      data: {
        url,
        clicks: url.clicks,
        uniqueClicks: uniqueIPs.size,
        timeline: timelineData,
        browsers: formatChartData(clicksByBrowser),
        os: formatChartData(clicksByOS),
        devices: formatChartData(clicksByDevice),
        referrers: formatChartData(clicksByReferrer),
        recentVisits: visits.slice(0, 30)
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
