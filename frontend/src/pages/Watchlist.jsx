import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WatchlistCard from '../components/WatchlistCard';
import Loader from '../components/Loader';
import { getWatchlist, removeFromWatchlist } from '../services/fundService';

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadWatchlist();
  }, []);

  const loadWatchlist = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getWatchlist();
      setWatchlist(res.data);
    } catch {
      setError('Failed to load watchlist. Please try again.');
      setWatchlist([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (schemeCode) => {
    try {
      await removeFromWatchlist(schemeCode);
      setWatchlist(prev => prev.filter(item => item.schemeCode !== schemeCode));
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="h-8 bg-slate-200 rounded-lg w-48 mb-2 animate-pulse" />
          <div className="h-4 bg-slate-200 rounded-lg w-32 animate-pulse" />
        </div>
        <Loader count={3} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Your Watchlist</h1>
            {watchlist.length > 0 && (
              <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-600 text-sm font-semibold rounded-full">
                {watchlist.length}
              </span>
            )}
          </div>
          <p className="text-slate-400 text-sm">Funds you are currently tracking</p>
        </div>
        {watchlist.length > 0 && (
          <button
            onClick={() => navigate('/')}
            className="btn-primary px-5 py-3 sm:py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add More Funds
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 px-5 py-4 rounded-xl text-sm flex items-center gap-3 mb-6">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
          <button onClick={loadWatchlist} className="ml-auto text-red-700 font-semibold hover:text-red-800 underline">
            Retry
          </button>
        </div>
      )}

      {!error && watchlist.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-5">
            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-600 mb-1">Your watchlist is empty</h3>
          <p className="text-sm text-slate-400 mb-6">Start by searching and adding mutual funds you want to track</p>
          <button
            onClick={() => navigate('/')}
            className="btn-primary px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search Funds
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {watchlist.map((item) => (
            <div key={item.schemeCode} className="animate-fade-in-up">
              <WatchlistCard
                item={item}
                onView={(code) => navigate(`/fund/${code}`)}
                onRemove={handleRemove}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
