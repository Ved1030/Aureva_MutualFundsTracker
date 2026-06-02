import { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
} from 'recharts';

const FILTERS = [
  { label: '1Y', days: 365 },
  { label: '3Y', days: 1095 },
  { label: '5Y', days: 1825 },
  { label: 'ALL', days: null },
];

function parseDate(str) {
  const [day, month, year] = str.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl shadow-xl px-4 py-3">
      <p className="text-xs font-medium text-slate-400 mb-1">{label}</p>
      <p className="text-lg font-bold text-indigo-600">
        ₹{Number(payload[0].value).toFixed(4)}
      </p>
    </div>
  );
}

function formatAxisDate(date, activeLabel) {
  if (activeLabel === '1Y') {
    return date.toLocaleDateString('en-IN', { month: 'short' });
  }
  if (activeLabel === '3Y') {
    return date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
  }
  return date.toLocaleDateString('en-IN', { year: 'numeric' });
}

function getTickGap(activeLabel) {
  switch (activeLabel) {
    case '1Y': return 25;
    case '3Y': return 50;
    case '5Y': return 80;
    default: return 100;
  }
}

export default function ChartComponent({ data }) {
  const [userFilter, setUserFilter] = useState('5Y');
  const [chartType, setChartType] = useState('area');

  const sortedData = useMemo(() => {
    if (!data || !data.length) return [];
    return data
      .filter(item => item && item.date && item.nav)
      .map(item => ({
        date: parseDate(item.date),
        nav: parseFloat(item.nav),
      }))
      .filter(item => !isNaN(item.nav) && !isNaN(item.date.getTime()))
      .sort((a, b) => a.date - b.date);
  }, [data]);

  const { displayedData, isFallback, formatLabel } = useMemo(() => {
    if (sortedData.length < 2) {
      return { displayedData: [], isFallback: false, formatLabel: userFilter };
    }

    const selectedFilter = FILTERS.find(f => f.label === userFilter);

    if (!selectedFilter || !selectedFilter.days) {
      return {
        displayedData: sortedData,
        isFallback: false,
        formatLabel: 'ALL',
      };
    }

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - selectedFilter.days);
    const filtered = sortedData.filter(item => item.date >= cutoff);

    if (filtered.length >= 2) {
      const dataStart = sortedData[0].date;
      const dataEnd = sortedData[sortedData.length - 1].date;
      const dataSpanMs = dataEnd - dataStart;
      const rangeSpanMs = selectedFilter.days * 24 * 60 * 60 * 1000;
      const isFullHistory = dataSpanMs < rangeSpanMs;

      return {
        displayedData: filtered,
        isFallback: isFullHistory,
        formatLabel: isFullHistory ? 'ALL' : userFilter,
      };
    }

    return {
      displayedData: sortedData,
      isFallback: true,
      formatLabel: 'ALL',
    };
  }, [sortedData, userFilter]);

  const chartData = useMemo(() => {
    return displayedData.map(item => ({
      date: formatAxisDate(item.date, formatLabel),
      tooltipDate: item.date.toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
      }),
      timestamp: item.date.getTime(),
      nav: item.nav,
    }));
  }, [displayedData, formatLabel]);

  const latestNav = displayedData.length > 0 ? displayedData[displayedData.length - 1].nav : null;
  const oldestNav = displayedData.length > 0 ? displayedData[0].nav : null;
  const growth = latestNav && oldestNav ? ((latestNav - oldestNav) / oldestNav * 100) : null;

  const tickGap = getTickGap(formatLabel);

  if (!data || data.length === 0 || sortedData.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center h-64 sm:h-80 text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
        <svg className="w-12 h-12 mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
        </svg>
        <p className="text-sm font-medium">No NAV data available</p>
        <p className="text-xs text-slate-400 mt-1">Historical data will appear here once available</p>
      </div>
    );
  }

  const domain = [Math.min(...chartData.map(d => d.nav)), Math.max(...chartData.map(d => d.nav))];
  const padding = (domain[1] - domain[0]) * 0.05 || 1;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-1.5 bg-slate-100 rounded-xl p-1 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f.label}
              onClick={() => setUserFilter(f.label)}
              className={`range-btn px-3 sm:px-4 py-1.5 text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${
                userFilter === f.label
                  ? 'range-btn-active'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 bg-slate-100 rounded-xl p-1">
          <button
            onClick={() => setChartType('area')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
              chartType === 'area'
                ? 'bg-white text-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Area
          </button>
          <button
            onClick={() => setChartType('line')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
              chartType === 'line'
                ? 'bg-white text-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Line
          </button>
        </div>
      </div>

      {isFallback && sortedData.length >= 2 && (
        <div className="mb-5">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Displaying maximum available history
          </span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-6 px-1">
        {latestNav && (
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Latest NAV</p>
            <p className="text-lg sm:text-xl font-bold text-slate-800">₹{latestNav.toFixed(4)}</p>
          </div>
        )}
        {oldestNav && (
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Range Start</p>
            <p className="text-lg sm:text-xl font-bold text-slate-800">₹{oldestNav.toFixed(4)}</p>
          </div>
        )}
        {growth !== null && (
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Growth</p>
            <p className={`text-lg sm:text-xl font-bold flex items-center gap-1 ${growth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                {growth >= 0 ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                )}
              </svg>
              {growth >= 0 ? '+' : ''}{growth.toFixed(2)}%
            </p>
          </div>
        )}
      </div>

      <div className="h-64 sm:h-72 md:h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id="navGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 500 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                minTickGap={tickGap}
              />
              <YAxis
                domain={[domain[0] - padding, domain[1] + padding]}
                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 500 }}
                tickFormatter={(val) => `₹${val.toFixed(2)}`}
                width={60}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="nav"
                stroke="#4f46e5"
                strokeWidth={2}
                fill="url(#navGradient)"
                dot={false}
                activeDot={{ r: 6, fill: '#4f46e5', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          ) : (
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 500 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                minTickGap={tickGap}
              />
              <YAxis
                domain={[domain[0] - padding, domain[1] + padding]}
                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 500 }}
                tickFormatter={(val) => `₹${val.toFixed(2)}`}
                width={60}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="nav"
                stroke="#4f46e5"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, fill: '#4f46e5', stroke: '#fff', strokeWidth: 2 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
