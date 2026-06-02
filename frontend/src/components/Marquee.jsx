import { useState, useEffect } from 'react';
import { searchFunds } from '../services/fundService';

const TICKER_FUNDS = [
  'SBI Bluechip Fund',
  'HDFC Flexi Cap Fund',
  'ICICI Prudential Value Discovery Fund',
  'Axis Growth Opportunities Fund',
  'Mirae Asset Large Cap Fund',
  'Kotak Flexicap Fund',
  'Parag Parikh Flexi Cap Fund',
  'Nippon India Small Cap Fund',
  'Quant Small Cap Fund',
  'SBI Small Cap Fund',
  'HDFC Mid-Cap Opportunities Fund',
  'ICICI Prudential Bluechip Fund',
  'UTI Nifty 50 Index Fund',
  'Motilal Oswal Midcap Fund',
  'Canara Robeco Bluechip Equity Fund',
];

export default function Marquee() {
  const [displayFunds, setDisplayFunds] = useState(TICKER_FUNDS);

  useEffect(() => {
    const fetchFirst = async () => {
      try {
        const res = await searchFunds('SBI');
        if (res.data?.length > 0) {
          const names = res.data.slice(0, 15).map(f => f.schemeName);
          if (names.length > 0) setDisplayFunds(names);
        }
      } catch {}
    };
    fetchFirst();
  }, []);

  const doubled = [...displayFunds, ...displayFunds];

  return (
    <div className="bg-slate-900 border-b border-slate-800 overflow-hidden h-10 w-full">
      <div className="relative flex items-center h-full">
        <div className="flex items-center gap-2 px-3 sm:px-4 bg-indigo-600 text-white text-xs font-semibold uppercase tracking-wider h-full z-10 relative shrink-0">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <span className="hidden sm:inline">Trending Funds</span>
        </div>
        <div className="overflow-hidden flex-1 h-full relative min-w-0">
          <div className="flex items-center h-full marquee-track whitespace-nowrap" style={{ width: 'fit-content' }}>
            {doubled.map((name, i) => (
              <span
                key={`${name}-${i}`}
                className="inline-flex items-center gap-2 px-4 sm:px-6 text-sm text-slate-300 border-r border-slate-700/50 h-full"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block shrink-0" />
                {name.length > 35 ? name.slice(0, 35) + '...' : name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
