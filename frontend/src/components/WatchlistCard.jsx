export default function WatchlistCard({ item, onView, onRemove }) {
  return (
    <div className="fund-card bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Tracking</span>
          </div>
          <h3 className="font-semibold text-slate-800 text-base leading-snug line-clamp-2">
            {item.schemeName}
          </h3>
          <p className="text-sm text-slate-400 mt-1.5">
            <span className="font-mono text-slate-500">#{item.schemeCode}</span>
            <span className="mx-2 text-slate-300">|</span>
            Added {new Date(item.addedAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-4 pt-4 border-t border-slate-100">
        <button
          onClick={() => onView(item.schemeCode)}
          className="flex-1 px-4 py-3 sm:py-2.5 text-sm font-semibold text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-all active:scale-[0.98]"
        >
          <svg className="w-4 h-4 inline-block mr-1.5 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          View Details
        </button>
        <button
          onClick={() => onRemove(item.schemeCode)}
          className="flex-1 px-4 py-3 sm:py-2.5 text-sm font-semibold text-red-500 bg-red-50 rounded-xl hover:bg-red-100 transition-all active:scale-[0.98]"
        >
          <svg className="w-4 h-4 inline-block mr-1 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Remove
        </button>
      </div>
    </div>
  );
}
