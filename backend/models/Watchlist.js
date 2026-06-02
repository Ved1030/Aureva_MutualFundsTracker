const mongoose = require('mongoose');

const watchlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  schemeCode: {
    type: String,
    required: true,
  },
  schemeName: {
    type: String,
    required: true,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

watchlistSchema.index({ user: 1, schemeCode: 1 }, { unique: true });

module.exports = mongoose.model('Watchlist', watchlistSchema);
