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
      console.warn(`[SEARCH] Missing search query`);
      return res.status(400).json({ message: 'Search query is required' });
    }

    console.log(`[SEARCH] Request received — query: "${q}"`);

    const cacheKey = 'all_funds';
    let funds = cache.get(cacheKey);

    if (funds === undefined) {
      console.log('[SEARCH] Cache miss — fetching all funds from MFAPI...');
      const response = await axios.get(`${MFAPI_BASE}/mf`, { timeout: 30000 });

      console.log(`[SEARCH] MFAPI status: ${response.status}`);
      console.log(`[SEARCH] MFAPI data type: ${typeof response.data}`);
      console.log(`[SEARCH] Is array: ${Array.isArray(response.data)}`);

      if (Array.isArray(response.data)) {
        funds = response.data;
        console.log(`[SEARCH] First item sample:`, JSON.stringify(response.data[0] || null).slice(0, 200));
      } else if (response.data && Array.isArray(response.data.data)) {
        funds = response.data.data;
        console.log(`[SEARCH] Extracted data.data array (${funds.length} items)`);
        console.log(`[SEARCH] First item sample:`, JSON.stringify(funds[0] || null).slice(0, 200));
      } else {
        console.error('[SEARCH] Invalid MFAPI response format — not an array and no data.data array found');
        console.error('[SEARCH] Response keys:', response.data ? Object.keys(response.data) : 'null');
        return res.status(502).json({ message: 'Invalid response from MFAPI' });
      }

      console.log(`[SEARCH] Cached ${funds.length} funds (TTL: 3600s)`);
      cache.set(cacheKey, funds, 3600);
    } else {
      console.log(`[SEARCH] Cache hit — ${funds.length} funds available`);
    }

    const query = q.trim().toLowerCase();
    const filtered = funds.filter(fund =>
      fund && fund.schemeName &&
      fund.schemeName.toLowerCase().includes(query)
    );

    const results = filtered.slice(0, 25);
    console.log(`[SEARCH] Result count: ${results.length}`);

    if (results.length === 0) {
      return res.status(404).json({ message: 'No funds found', data: [] });
    }

    res.json(results);
  } catch (error) {
    console.error(`[SEARCH] Error: ${error.message}`);
    if (error.response) {
      console.error(`[SEARCH] Error response status: ${error.response.status}`);
      console.error(`[SEARCH] Error response data type: ${typeof error.response.data}`);

      if (error.response.status >= 400) {
        console.error(`[SEARCH] MFAPI HTTP error: ${error.response.status}`);
        return res.status(502).json({ message: `MFAPI returned status ${error.response.status}` });
      }

      if (error.response.status === 200) {
        console.error('[SEARCH] MFAPI returned 200 but processing failed — checking partial data...');
        const partialData = error.response.data;
        if (Array.isArray(partialData)) {
          funds = partialData;
          console.log(`[SEARCH] Recovered ${funds.length} funds from partial data`);
          cache.set(cacheKey, funds, 3600);

          const query = q.trim().toLowerCase();
          const filtered = funds.filter(fund =>
            fund && fund.schemeName &&
            fund.schemeName.toLowerCase().includes(query)
          );
          const results = filtered.slice(0, 25);
          console.log(`[SEARCH] Result count: ${results.length}`);
          return results.length === 0
            ? res.status(404).json({ message: 'No funds found', data: [] })
            : res.json(results);
        }
        if (partialData && Array.isArray(partialData.data)) {
          funds = partialData.data;
          console.log(`[SEARCH] Recovered ${funds.length} funds from partial data.data`);
          cache.set(cacheKey, funds, 3600);

          const query = q.trim().toLowerCase();
          const filtered = funds.filter(fund =>
            fund && fund.schemeName &&
            fund.schemeName.toLowerCase().includes(query)
          );
          const results = filtered.slice(0, 25);
          console.log(`[SEARCH] Result count: ${results.length}`);
          return results.length === 0
            ? res.status(404).json({ message: 'No funds found', data: [] })
            : res.json(results);
        }
      }
    }

    if (error.code === 'ECONNABORTED') {
      console.error('[SEARCH] MFAPI request timed out');
      return res.status(504).json({ message: 'MFAPI request timed out. Please try again.' });
    }

    console.error('[SEARCH] Internal error:', error.message);
    res.status(500).json({ message: 'Failed to search funds. Please try again.' });
  }
};

const getFundDetails = async (req, res) => {
  try {
    const { schemeCode } = req.params;

    console.log(`[DETAILS] Request received — schemeCode: ${schemeCode}`);

    if (!schemeCode) {
      return res.status(400).json({ message: 'Scheme code is required' });
    }

    if (!/^\d+$/.test(schemeCode)) {
      console.warn(`[DETAILS] Invalid schemeCode format: ${schemeCode}`);
      return res.status(400).json({ message: 'Invalid scheme code format' });
    }

    const cacheKey = `fund_${schemeCode}`;
    let data = cache.get(cacheKey);

    if (data === undefined) {
      console.log(`[DETAILS] Cache miss — fetching fund ${schemeCode} from MFAPI...`);
      const response = await axios.get(`${MFAPI_BASE}/mf/${schemeCode}`, { timeout: 15000 });

      console.log(`[DETAILS] MFAPI status: ${response.status}`);
      data = response.data;

      if (!data || !data.meta) {
        console.error(`[DETAILS] Fund ${schemeCode} not found in MFAPI response`);
        return res.status(404).json({ message: 'Fund not found' });
      }

      cache.set(cacheKey, data, 3600);
      console.log(`[DETAILS] Fund ${schemeCode} cached (${data.data?.length || 0} NAV records)`);
    } else {
      console.log(`[DETAILS] Cache hit — fund ${schemeCode}`);
    }

    res.json(data);
  } catch (error) {
    console.error(`[DETAILS] Error: ${error.message}`);
    if (error.response) {
      console.error(`[DETAILS] Error response status: ${error.response.status}`);
      if (error.response.status === 404) {
        return res.status(404).json({ message: 'Fund not found' });
      }
      if (error.response.status >= 400) {
        console.error(`[DETAILS] MFAPI HTTP error: ${error.response.status}`);
        return res.status(502).json({ message: `MFAPI returned status ${error.response.status}` });
      }
    }
    if (error.code === 'ECONNABORTED') {
      console.error('[DETAILS] MFAPI request timed out');
      return res.status(504).json({ message: 'MFAPI request timed out. Please try again.' });
    }
    console.error('[DETAILS] Internal error:', error.message);
    res.status(500).json({ message: 'Failed to load fund details. Please try again.' });
  }
};

module.exports = { searchFunds, getFundDetails };
