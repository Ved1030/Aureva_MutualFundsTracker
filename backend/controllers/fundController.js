const axios = require('axios');
const cache = require('../utils/cache');

const MFAPI_BASE = 'https://api.mfapi.in';
const CACHE_KEY = 'allFunds';
const CACHE_TTL = 3600;
const MAX_RESULTS = 50;
const AXIOS_TIMEOUT = 10000;

const searchFunds = async (req, res) => {
  try {
    const start = Date.now();
    const q = req.query?.q;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const query = q.trim();
    if (query.length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }

    const queryLower = query.toLowerCase();
    let funds = cache.get(CACHE_KEY);

    if (funds === undefined) {
      console.log('[SEARCH] cache miss');
      try {
        const response = await axios.get(`${MFAPI_BASE}/mf`, { timeout: AXIOS_TIMEOUT });

        if (Array.isArray(response.data)) {
          funds = response.data;
        } else if (response.data && Array.isArray(response.data.data)) {
          funds = response.data.data;
        } else {
          console.error('[SEARCH] invalid MFAPI response');
          return res.status(502).json({ message: 'Invalid response from MFAPI' });
        }

        cache.set(CACHE_KEY, funds, CACHE_TTL);
      } catch (fetchErr) {
        if (fetchErr.code === 'ECONNABORTED') {
          console.error('[SEARCH] MFAPI timeout');
          return res.status(504).json({ message: 'MFAPI request timed out. Please try again.' });
        }
        if (fetchErr.response) {
          console.error(`[SEARCH] MFAPI HTTP ${fetchErr.response.status}`);
          return res.status(502).json({ message: `MFAPI returned status ${fetchErr.response.status}` });
        }
        console.error('[SEARCH] network error:', fetchErr.message);
        return res.status(502).json({ message: 'MFAPI is unavailable. Please try again.' });
      }
    } else {
      console.log('[SEARCH] cache hit');
    }

    const results = [];
    for (let i = 0; i < funds.length; i++) {
      const fund = funds[i];
      if (fund && fund.schemeName && fund.schemeCode) {
        if (fund.schemeName.toLowerCase().includes(queryLower)) {
          results.push({ schemeCode: fund.schemeCode, schemeName: fund.schemeName });
          if (results.length >= MAX_RESULTS) break;
        }
      }
    }

    const duration = Date.now() - start;
    const mem = process.memoryUsage();
    console.log(`[SEARCH] results=${results.length} duration=${duration}ms mem=${Math.round(mem.heapUsed / 1024 / 1024)}MB`);

    if (results.length === 0) {
      return res.status(404).json({ message: 'No funds found', data: [] });
    }

    res.json(results);
  } catch (err) {
    console.error('[SEARCH] error:', err.message);
    res.status(500).json({ message: 'Failed to search funds. Please try again.' });
  }
};

const getFundDetails = async (req, res) => {
  try {
    const { schemeCode } = req.params;

    if (!schemeCode) {
      return res.status(400).json({ message: 'Scheme code is required' });
    }

    if (!/^\d+$/.test(schemeCode)) {
      return res.status(400).json({ message: 'Invalid scheme code format' });
    }

    const cacheKey = `fund_${schemeCode}`;
    let data = cache.get(cacheKey);

    if (data === undefined) {
      console.log(`[DETAILS] cache miss fund ${schemeCode}`);
      try {
        const response = await axios.get(`${MFAPI_BASE}/mf/${schemeCode}`, { timeout: AXIOS_TIMEOUT });
        data = response.data;

        if (!data || !data.meta) {
          return res.status(404).json({ message: 'Fund not found' });
        }

        cache.set(cacheKey, data, 3600);
      } catch (fetchErr) {
        if (fetchErr.code === 'ECONNABORTED') {
          console.error('[DETAILS] MFAPI timeout');
          return res.status(504).json({ message: 'MFAPI request timed out. Please try again.' });
        }
        if (fetchErr.response) {
          if (fetchErr.response.status === 404) {
            return res.status(404).json({ message: 'Fund not found' });
          }
          console.error(`[DETAILS] MFAPI HTTP ${fetchErr.response.status}`);
          return res.status(502).json({ message: `MFAPI returned status ${fetchErr.response.status}` });
        }
        console.error('[DETAILS] network error:', fetchErr.message);
        return res.status(502).json({ message: 'MFAPI is unavailable. Please try again.' });
      }
    } else {
      console.log(`[DETAILS] cache hit fund ${schemeCode}`);
    }

    res.json(data);
  } catch (err) {
    console.error('[DETAILS] error:', err.message);
    res.status(500).json({ message: 'Failed to load fund details. Please try again.' });
  }
};

module.exports = { searchFunds, getFundDetails };
