import { useState, useEffect, useRef } from 'react';

export default function SearchBar({ onSearch, onDebouncedSearch, loading }) {
  const [query, setQuery] = useState('');
  const debounceRef = useRef(null);
  const pendingRef = useRef(false);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    if (query.trim().length >= 2 && !pendingRef.current) {
      debounceRef.current = setTimeout(() => {
        pendingRef.current = true;
        onDebouncedSearch?.(query.trim());
      }, 400);
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, onDebouncedSearch]);

  useEffect(() => {
    if (!loading) {
      pendingRef.current = false;
    }
  }, [loading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (query.trim() && !loading) {
      pendingRef.current = true;
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 sm:pl-5 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search mutual funds by name..."
            className="search-input w-full pl-11 sm:pl-12 pr-4 py-3.5 sm:py-4 text-base bg-white border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-400 text-slate-800 placeholder-slate-400 shadow-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="btn-primary px-5 sm:px-6 py-3.5 sm:py-4 bg-indigo-600 text-white text-sm font-semibold rounded-2xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none transition-all shrink-0"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="hidden sm:inline">Searching</span>
            </span>
          ) : (
            <span className="flex items-center justify-center gap-1.5">
              Search
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </span>
          )}
        </button>
      </div>
    </form>
  );
}
