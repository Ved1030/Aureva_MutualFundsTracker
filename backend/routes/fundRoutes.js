const express = require('express');
const router = express.Router();
const { searchFunds, getFundDetails } = require('../controllers/fundController');

router.get('/search', searchFunds);
router.get('/:schemeCode', getFundDetails);

module.exports = router;
