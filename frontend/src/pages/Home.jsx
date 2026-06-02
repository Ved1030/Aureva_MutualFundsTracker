import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import FundCard from '../components/FundCard';
import Loader from '../components/Loader';
import Marquee from '../components/Marquee';
import { searchFunds, addToWatchlist, getWatchlist } from '../services/fundService';
import { groupFunds } from '../utils/fundGrouping';

function StatCard({ icon, label, value, color }) {
  return (
    <div className="stat-card bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider truncate">{label}</p>
        <p className="text-xl sm:text-2xl font-bold text-slate-800 mt-0.5 truncate">{value}</p>
      </div>
    </div>
  );
}

export default function Home() {
  const [results, setResults] = useState([]);
  const [groupedResults, setGroupedResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState('');
  const [watchlistSet, setWatchlistSet] = useState(new Set());
  const [addingCode, setAddingCode] = useState(null);
  const [stats, setStats] = useState({ totalResults: 0, watchlistCount: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    getWatchlist().then(res => {
      const data = res.data || [];
      setWatchlistSet(new Set(data.map(w => w.schemeCode)));
      setStats(prev => ({ ...prev, watchlistCount: data.length }));
    }).catch(() => {});
  }, []);

  const doSearch = useCallback(async (query) => {
    setLoading(true);
    setSearched(true);
    setError('');
    setErrorType('');
    try {
      const res = await searchFunds(query);
      const funds = res.data || [];
      setResults(funds);
      const grouped = groupFunds(funds);
      setGroupedResults(grouped);
      setStats(prev => ({ ...prev, totalResults: funds.length }));
      if (!funds.length) {
        setError('No funds found matching your search. Try a different name like "SBI", "HDFC", or "ICICI".');
        setErrorType('empty');
      }
    } catch (err) {
      setResults([]);
      setGroupedResults([]);
      const status = err.response?.status;
      const msg = err.response?.data?.message;
      if (status === 404) {
        setError(msg || 'No funds found matching your search. Try a different name like "SBI", "HDFC", or "ICICI".');
        setErrorType('empty');
      } else if (status === 504 || status === 502) {
        setError(msg || 'The fund data service is temporarily unavailable. Please try again.');
        setErrorType('server');
      } else if (status === 400) {
        setError(msg || 'Please enter a search term.');
        setErrorType('empty');
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        setError('Cannot reach the server. Make sure the backend is running on port 5000.');
        setErrorType('network');
      } else {
        setError(msg || 'Search failed. Please try again.');
        setErrorType('server');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback((query) => {
    doSearch(query);
  }, [doSearch]);

  const handleDebouncedSearch = useCallback((query) => {
    doSearch(query);
  }, [doSearch]);

  const handleAdd = async (schemeCode, schemeName) => {
    setAddingCode(schemeCode);
    try {
      await addToWatchlist({ schemeCode, schemeName });
      setWatchlistSet(prev => new Set([...prev, schemeCode]));
      setStats(prev => ({ ...prev, watchlistCount: prev.watchlistCount + 1 }));
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login');
      } else if (err.response?.status === 400 || err.response?.status === 409) {
        setWatchlistSet(prev => new Set([...prev, schemeCode]));
      }
    } finally {
      setAddingCode(null);
    }
  };

  const renderErrorState = () => {
    const icons = {
      empty: (
        <svg className="w-14 h-14 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      network: (
        <svg className="w-14 h-14 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      ),
      server: (
        <svg className="w-14 h-14 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      ),
    };

    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
        {icons[errorType] || icons.empty}
        <h3 className="text-lg font-semibold text-slate-600 mt-5 mb-1.5">
          {errorType === 'network' ? 'Connection Error' :
           errorType === 'server' ? 'Service Unavailable' :
           'No Results'}
        </h3>
        <p className="text-sm text-slate-400 text-center max-w-md px-4">{error}</p>
        <button
          onClick={() => { setSearched(false); setError(''); }}
          className="mt-6 px-5 py-2.5 text-sm font-semibold text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-all"
        >
          Clear Search
        </button>
      </div>
    );
  };

  return (
    <div className="overflow-x-hidden">
      <Marquee />

      <div className="hero-gradient relative overflow-hidden">
        <div className="hero-glow bg-indigo-500 -top-40 -left-40 max-md:hidden" />
        <div className="hero-glow bg-purple-500 top-20 -right-20 max-md:hidden" />
        <div className="relative max-w-4xl mx-auto px-4 py-16 sm:py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/10 mb-6 md:mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs md:text-sm font-medium text-white/80">Track 10,000+ Indian Mutual Funds</span>
          </div>
          <h1 className="text-[clamp(28px,5vw,32px)] sm:text-5xl md:text-[42px] lg:text-7xl font-extrabold text-white leading-tight mb-5 tracking-tight">
            Track Indian{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">
              Mutual Funds
            </span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-8 md:mb-10 font-medium px-2">
            Search, analyze and monitor your favorite mutual funds with real-time NAV tracking and interactive charts
          </p>
          <SearchBar
            onSearch={handleSearch}
            onDebouncedSearch={handleDebouncedSearch}
            loading={loading}
          />
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 mt-8 text-white/40 text-sm">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              10K+ Funds
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Interactive Charts
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Secure & Free
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {searched && !loading && !error && results.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 mb-8 animate-fade-in-up">
            <StatCard
              icon={<svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
              label="Search Results"
              value={results.length}
              color="bg-indigo-50"
            />
            <StatCard
              icon={<svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>}
              label="In Watchlist"
              value={stats.watchlistCount}
              color="bg-emerald-50"
            />
            <StatCard
              icon={<svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
              label="Funds Grouped"
              value={groupedResults.length}
              color="bg-purple-50"
            />
            <StatCard
              icon={<svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
              label="Total Variants"
              value={results.length}
              color="bg-amber-50"
            />
          </div>
        )}

        {loading && <Loader count={3} />}

        {!loading && searched && error && (
          renderErrorState()
        )}

        {!loading && groupedResults.length > 0 && (
          <div className="animate-fade-in-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  {results.length > groupedResults.length
                    ? `${groupedResults.length} Funds Found`
                    : 'Search Results'}
                </h2>
                <p className="text-sm text-slate-400 mt-0.5">
                  {results.length} total variant{results.length > 1 ? 's' : ''} across {groupedResults.length} fund{groupedResults.length > 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={() => { setResults([]); setGroupedResults([]); setSearched(false); setError(''); }}
                className="text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors self-start sm:self-auto"
              >
                Clear Results
              </button>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {groupedResults.map((group) => (
                <FundCard
                  key={group.baseName}
                  group={group}
                  watchlistSet={watchlistSet}
                  adding={addingCode}
                  onAdd={handleAdd}
                  onView={(code) => navigate(`/fund/${code}`)}
                />
              ))}
            </div>
          </div>
        )}

        {!loading && !searched && (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
              <StatCard
                icon={<svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
                label="Total Funds"
                value="10,000+"
                color="bg-indigo-50"
              />
              <StatCard
                icon={<svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
                label="Categories"
                value="40+"
                color="bg-emerald-50"
              />
              <StatCard
                icon={<svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
                label="NAV Updated"
                value="Daily"
                color="bg-purple-50"
              />
              <StatCard
                icon={<svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
                label="Your Watchlist"
                value={stats.watchlistCount}
                color="bg-amber-50"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Large Cap Funds', desc: 'Stable returns from top 100 companies by market capitalization', icon: '🛡️', color: 'from-blue-500 to-blue-600' },
                { label: 'Mid Cap Funds', desc: 'Growth potential from 101st to 250th ranked companies', icon: '📈', color: 'from-purple-500 to-purple-600' },
                { label: 'Small Cap Funds', desc: 'High risk high return from companies ranked 251st onwards', icon: '🚀', color: 'from-rose-500 to-rose-600' },
              ].map((item) => (
                <div key={item.label} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 cursor-default">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-lg mb-4 shadow-sm`}>
                    {item.icon}
                  </div>
                  <h3 className="font-semibold text-slate-800 text-sm">{item.label}</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
