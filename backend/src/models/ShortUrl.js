const mongoose = require('mongoose');

const ShortUrlSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  originalUrl: {
    type: String,
    required: [true, 'Please provide the original URL'],
    trim: true
  },
  shortCode: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true
  },
  customAlias: {
    type: String,
    unique: true,
    sparse: true,
    index: true,
    trim: true
  },
  title: {
    type: String,
    trim: true,
    default: ''
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: null
  },
  clicks: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('ShortUrl', ShortUrlSchema);
