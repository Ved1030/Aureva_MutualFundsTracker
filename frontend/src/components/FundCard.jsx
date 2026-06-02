import { useState } from 'react';
import { getDisplayVariants } from '../utils/fundGrouping';

function VariantRow({ fund, watchlistSet, adding, onAdd, onView }) {
  const isInWatchlist = watchlistSet?.has?.(fund.schemeCode);
  return (
    <div className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors rounded-lg group">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-300 shrink-0" />
        <span className="text-sm text-slate-600 font-medium truncate">
          {fund.variantLabel || fund.schemeName}
        </span>
        <span className="text-xs text-slate-400 font-mono shrink-0">#{fund.schemeCode}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onView(fund.schemeCode)}
          className="px-3 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-all"
        >
          View
        </button>
        {!isInWatchlist ? (
          <button
            onClick={() => onAdd(fund.schemeCode, fund.schemeName)}
            disabled={adding === fund.schemeCode}
            className="px-3 py-1 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all"
          >
            {adding === fund.schemeCode ? '...' : '+ Add'}
          </button>
        ) : (
          <span className="px-3 py-1 text-xs font-semibold text-emerald-600 bg-emerald-50 rounded-lg flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Added
          </span>
        )}
      </div>
    </div>
  );
}

export default function FundCard({ group, watchlistSet, adding, onAdd, onView }) {
  const [expanded, setExpanded] = useState(false);
  const { baseName, variants, count } = group;
  const displayVariants = getDisplayVariants(variants, baseName);

  const hasDuplicates = count > 1;
  const growthVariants = displayVariants.filter(v =>
    v.variantLabel?.toLowerCase().includes('growth')
  );
  const defaultVariants = growthVariants.length > 0 ? growthVariants : displayVariants.slice(0, 2);

  const anyInWatchlist = variants.some(v => watchlistSet?.has?.(v.schemeCode));
  const shownVariants = expanded ? displayVariants : defaultVariants;

  return (
    <div className="fund-card bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5 pb-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-md uppercase tracking-wider">
                MF
              </span>
              {hasDuplicates ? (
                <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-xs font-semibold rounded-md">
                  {count} Variants
                </span>
              ) : (
                <span className="text-xs text-slate-400 font-medium">Scheme</span>
              )}
            </div>
            <h3 className="font-semibold text-slate-800 text-base leading-snug line-clamp-2">
              {baseName}
            </h3>
          </div>
          {anyInWatchlist && (
            <div className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-xs font-semibold rounded-lg flex items-center gap-1 shrink-0">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Tracking
            </div>
          )}
        </div>
      </div>

      <div className="px-5 pb-3">
        <div className="mt-2 space-y-0.5">
          {shownVariants.map((v) => (
            <VariantRow
              key={v.schemeCode}
              fund={v}
              watchlistSet={watchlistSet}
              adding={adding}
              onAdd={onAdd}
              onView={onView}
            />
          ))}
        </div>

        {hasDuplicates && displayVariants.length > defaultVariants.length && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 mt-2 px-4 py-1.5 transition-colors"
          >
            {expanded ? (
              <>Show Less <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg></>
            ) : (
              <>View All {count} Variants <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg></>
            )}
          </button>
        )}
      </div>

      {!hasDuplicates && (
        <div className="flex items-center gap-3 px-5 pb-5 pt-3 border-t border-slate-100">
          <button
            onClick={() => onView(variants[0].schemeCode)}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-all active:scale-[0.98]"
          >
            View Details
          </button>
          {!watchlistSet?.has?.(variants[0].schemeCode) ? (
            <button
              onClick={() => onAdd(variants[0].schemeCode, variants[0].schemeName)}
              disabled={adding === variants[0].schemeCode}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed btn-primary active:scale-[0.98]"
            >
              {adding === variants[0].schemeCode ? 'Adding...' : '+ Add to Watchlist'}
            </button>
          ) : (
            <div className="flex-1 px-4 py-2.5 text-sm font-semibold text-emerald-600 bg-emerald-50 rounded-xl text-center flex items-center justify-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              In Watchlist
            </div>
          )}
        </div>
      )}
    </div>
  );
}
