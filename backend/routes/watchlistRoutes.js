const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getWatchlist, addToWatchlist, removeFromWatchlist } = require('../controllers/watchlistController');

router.get('/', auth, getWatchlist);
router.post('/', auth, addToWatchlist);
router.delete('/:schemeCode', auth, removeFromWatchlist);

module.exports = router;
