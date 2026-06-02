const axios = require('axios');
const cache = require('../utils/cache');

const MFAPI_BASE = 'https://api.mfapi.in';

function getQueryParam(req, name) {
  if (typeof req.query === 'object' && req.query !== null) {
    if (typeof req.query.get === 'function') {
      return req.query.get(name);
    }
    return req.query[name];
  }
  return undefined;
}

const searchFunds = async (req, res) => {
  try {
    const q = getQueryParam(req, 'q');

    if (!q || !q.trim()) {
      console.warn(`[FUNDS] Search missing query param`);
      return res.status(400).json({ message: 'Search query is required' });
    }

    const cacheKey = 'all_funds';
    let funds = cache.get(cacheKey);

    if (funds === undefined) {
      console.log('[FUNDS] Cache miss — fetching all funds from MFAPI...');
      const response = await axios.get(`${MFAPI_BASE}/mf`, { timeout: 15000 });
      funds = response.data;

      if (!Array.isArray(funds)) {
        console.error('[FUNDS] Invalid MFAPI response format');
        return res.status(502).json({ message: 'Invalid response from MFAPI' });
      }

      console.log(`[FUNDS] Cached ${funds.length} funds (TTL: 3600s)`);
      cache.set(cacheKey, funds, 3600);
    } else {
      console.log(`[FUNDS] Cache hit — ${funds.length} funds available`);
    }

    const query = q.trim().toLowerCase();
    const filtered = funds.filter(fund =>
      fund && fund.schemeName &&
      fund.schemeName.toLowerCase().includes(query)
    );

    const results = filtered.slice(0, 25);
    console.log(`[FUNDS] Search "${q}" → ${results.length} results`);
    res.json(results);
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      console.error('[FUNDS] MFAPI request timed out');
      return res.status(504).json({ message: 'MFAPI request timed out. Please try again.' });
    }
    if (error.response) {
      console.error('[FUNDS] MFAPI HTTP error:', error.response.status);
      return res.status(502).json({ message: `MFAPI returned status ${error.response.status}` });
    }
    console.error('[FUNDS] Search error:', error.message);
    res.status(500).json({ message: 'Failed to search funds. Please try again.' });
  }
};

const getFundDetails = async (req, res) => {
  try {
    const { schemeCode } = req.params;

    console.log(`[FUNDS] Details request — schemeCode: ${schemeCode}`);

    if (!schemeCode) {
      return res.status(400).json({ message: 'Scheme code is required' });
    }

    if (!/^\d+$/.test(schemeCode)) {
      console.warn(`[FUNDS] Invalid schemeCode format: ${schemeCode}`);
      return res.status(400).json({ message: 'Invalid scheme code format' });
    }

    const cacheKey = `fund_${schemeCode}`;
    let data = cache.get(cacheKey);

    if (data === undefined) {
      console.log(`[FUNDS] Cache miss — fetching fund ${schemeCode} from MFAPI...`);
      const response = await axios.get(`${MFAPI_BASE}/mf/${schemeCode}`, { timeout: 15000 });
      data = response.data;

      if (!data || !data.meta) {
        console.error(`[FUNDS] Fund ${schemeCode} not found in MFAPI response`);
        return res.status(404).json({ message: 'Fund not found' });
      }

      cache.set(cacheKey, data, 3600);
      console.log(`[FUNDS] Fund ${schemeCode} cached (${data.data?.length || 0} NAV records)`);
    } else {
      console.log(`[FUNDS] Cache hit — fund ${schemeCode}`);
    }

    res.json(data);
  } catch (error) {
    if (error.response?.status === 404) {
      return res.status(404).json({ message: 'Fund not found' });
    }
    if (error.code === 'ECONNABORTED') {
      console.error('[FUNDS] MFAPI request timed out');
      return res.status(504).json({ message: 'MFAPI request timed out. Please try again.' });
    }
    if (error.response) {
      console.error('[FUNDS] MFAPI HTTP error:', error.response.status);
      return res.status(502).json({ message: `MFAPI returned status ${error.response.status}` });
    }
    console.error('[FUNDS] Details error:', error.message);
    res.status(500).json({ message: 'Failed to load fund details. Please try again.' });
  }
};

module.exports = { searchFunds, getFundDetails };
