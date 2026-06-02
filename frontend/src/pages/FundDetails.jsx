import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ChartComponent from '../components/ChartComponent';
import { getFundDetails, addToWatchlist } from '../services/fundService';

function StatCard({ label, value, suffix, color = 'text-slate-800' }) {
  return (
    <div className="stat-card bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>
        {value}
        {suffix && <span className="text-sm font-medium text-slate-400 ml-1">{suffix}</span>}
      </p>
    </div>
  );
}

export default function FundDetails() {
  const { schemeCode } = useParams();
  const navigate = useNavigate();
  const [fund, setFund] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState('');
  const [added, setAdded] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadFund();
  }, [schemeCode]);

  const loadFund = async () => {
    setLoading(true);
    setError('');
    setErrorType('');
    try {
      const res = await getFundDetails(schemeCode);
      setFund(res.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('The requested fund was not found. It may have been removed or the code is invalid.');
        setErrorType('notfound');
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        setError('Unable to connect to the server. Please check your connection.');
        setErrorType('network');
      } else {
        setError('Failed to load fund details. Please try again.');
        setErrorType('server');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    setAdding(true);
    try {
      await addToWatchlist({ schemeCode, schemeName: fund.meta.scheme_name });
      setAdded(true);
    } catch (err) {
      if (err.response?.status === 400 || err.response?.status === 409) {
        setAdded(true);
      } else if (err.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setAdding(false);
    }
  };

  const navData = fund?.data || [];

  const analytics = useMemo(() => {
    if (!navData.length) return null;
    const parsed = navData
      .filter(d => d && d.date && d.nav)
      .map(d => ({
        date: (() => { const [day, month, year] = d.date.split('-').map(Number); return new Date(year, month - 1, day); })(),
        nav: parseFloat(d.nav),
      }))
      .filter(d => !isNaN(d.nav) && !isNaN(d.date.getTime()))
      .sort((a, b) => a.date - b.date);

    if (!parsed.length) return null;

    const navValues = parsed.map(d => d.nav);
    const latest = navValues[navValues.length - 1];
    const oldest = navValues[0];
    const highest = Math.max(...navValues);
    const lowest = Math.min(...navValues);
    const growth = ((latest - oldest) / oldest) * 100;
    const yearsOfHistory = (parsed[parsed.length - 1].date - parsed[0].date) / (365.25 * 24 * 60 * 60 * 1000);

    return { latest, oldest, highest, lowest, growth, yearsOfHistory, totalPoints: navData.length };
  }, [navData]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-6 bg-slate-200 rounded-lg w-48" />
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="h-7 bg-slate-200 rounded-lg w-2/3" />
            <div className="h-5 bg-slate-200 rounded-lg w-1/3" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-20 bg-slate-200 rounded-xl" />
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="h-6 bg-slate-200 rounded-lg w-48 mb-4" />
            <div className="h-80 bg-slate-200 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    const icons = {
      notfound: (
        <svg className="w-14 h-14 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
        </svg>
      ),
      network: (
        <svg className="w-14 h-14 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728m-2.829-2.829a5 5 0 000-7.07m-4.243 4.243a1 1 0 010-1.414" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m0 4h.01" />
        </svg>
      ),
      server: (
        <svg className="w-14 h-14 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      ),
    };

    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-2xl border border-slate-200 p-12 shadow-sm max-w-md mx-auto">
          <div className="flex justify-center mb-5">
            {icons[errorType] || icons.notfound}
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-1.5">
            {errorType === 'notfound' ? 'Fund Not Found' : 'Unable to Load Fund'}
          </h3>
          <p className="text-sm text-slate-400 mb-6">{error}</p>
          <button
            onClick={loadFund}
            className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in-up">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-slate-600 mb-6 transition-colors group"
      >
        <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-md uppercase tracking-wider">
                Mutual Fund
              </span>
              {fund?.meta?.scheme_category && (
                <span className="text-xs text-slate-400 font-medium">{fund.meta.scheme_category}</span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 leading-snug">
              {fund?.meta?.scheme_name}
            </h1>
            <p className="text-sm text-slate-400 mt-1.5 font-mono">Scheme Code: {fund?.meta?.scheme_code}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {!added ? (
              <button
                onClick={handleAdd}
                disabled={adding}
                className="btn-primary px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                {adding ? 'Adding...' : 'Add to Watchlist'}
              </button>
            ) : (
              <div className="px-5 py-2.5 bg-emerald-50 text-emerald-600 text-sm font-semibold rounded-xl flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                In Watchlist
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
          <StatCard
            label="Latest NAV"
            value={analytics?.latest ? `₹${analytics.latest.toFixed(4)}` : 'N/A'}
            color="text-indigo-600"
          />
          <StatCard
            label="Highest NAV"
            value={analytics?.highest ? `₹${analytics.highest.toFixed(4)}` : 'N/A'}
            color="text-emerald-600"
          />
          <StatCard
            label="Lowest NAV"
            value={analytics?.lowest ? `₹${analytics.lowest.toFixed(4)}` : 'N/A'}
            color="text-rose-600"
          />
          <StatCard
            label="Growth"
            value={analytics?.growth !== undefined ? `${analytics.growth >= 0 ? '+' : ''}${analytics.growth.toFixed(2)}` : 'N/A'}
            suffix="%"
            color={analytics?.growth >= 0 ? 'text-emerald-600' : 'text-red-500'}
          />
          <StatCard
            label="Data Points"
            value={analytics?.totalPoints?.toLocaleString() || '0'}
            suffix="records"
          />
          <StatCard
            label="History"
            value={analytics?.yearsOfHistory ? `${Math.ceil(analytics.yearsOfHistory)}` : 'N/A'}
            suffix={analytics?.yearsOfHistory ? 'yr' : ''}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="mb-2">
          <h2 className="text-lg font-bold text-slate-800">NAV Performance</h2>
          <p className="text-sm text-slate-400 mt-0.5">Historical net asset value over time</p>
        </div>
        <ChartComponent data={navData} />
      </div>
    </div>
  );
}
