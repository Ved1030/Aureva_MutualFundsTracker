const Watchlist = require('../models/Watchlist');

const getWatchlist = async (req, res) => {
  try {
    const watchlist = await Watchlist.find({ user: req.user.id }).sort({ addedAt: -1 });
    res.json(watchlist);
  } catch (error) {
    console.error('[WATCHLIST] Error fetching:', error.message);
    res.status(500).json({ message: 'Error fetching watchlist' });
  }
};

const addToWatchlist = async (req, res) => {
  try {
    const { schemeCode, schemeName } = req.body;

    if (!schemeCode || !schemeName) {
      return res.status(400).json({ message: 'schemeCode and schemeName are required' });
    }

    const existing = await Watchlist.findOne({
      user: req.user.id,
      schemeCode,
    });

    if (existing) {
      return res.status(409).json({ message: 'Fund is already in your watchlist' });
    }

    const entry = await Watchlist.create({
      user: req.user.id,
      schemeCode,
      schemeName,
    });

    res.status(201).json(entry);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Fund is already in your watchlist' });
    }
    console.error('[WATCHLIST] Error adding:', error.message);
    res.status(500).json({ message: 'Error adding to watchlist' });
  }
};

const removeFromWatchlist = async (req, res) => {
  try {
    const { schemeCode } = req.params;

    const entry = await Watchlist.findOneAndDelete({
      user: req.user.id,
      schemeCode,
    });

    if (!entry) {
      return res.status(404).json({ message: 'Watchlist entry not found' });
    }

    res.json({ message: 'Removed from watchlist' });
  } catch (error) {
    console.error('[WATCHLIST] Error removing:', error.message);
    res.status(500).json({ message: 'Error removing from watchlist' });
  }
};

module.exports = { getWatchlist, addToWatchlist, removeFromWatchlist };
