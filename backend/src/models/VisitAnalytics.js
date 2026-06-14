const mongoose = require('mongoose');

const VisitAnalyticsSchema = new mongoose.Schema({
  shortUrl: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ShortUrl',
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  userAgent: {
    type: String,
    default: 'Unknown'
  },
  browser: {
    type: String,
    default: 'Unknown'
  },
  os: {
    type: String,
    default: 'Unknown'
  },
  device: {
    type: String,
    default: 'Desktop'
  },
  referrer: {
    type: String,
    default: 'Direct'
  },
  ipAddress: {
    type: String,
    default: 'Anonymized'
  }
});

module.exports = mongoose.model('VisitAnalytics', VisitAnalyticsSchema);
