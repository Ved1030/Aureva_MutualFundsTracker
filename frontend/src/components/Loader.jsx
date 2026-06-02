export default function Loader({ count = 3 }) {
  return (
    <div className="space-y-4 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-5 w-12 bg-slate-200 rounded-md" />
            <div className="h-3 w-10 bg-slate-200 rounded" />
          </div>
          <div className="h-5 bg-slate-200 rounded w-3/4 mb-2" />
          <div className="h-4 bg-slate-200 rounded w-1/3 mb-4" />
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <div className="h-10 bg-slate-200 rounded-xl flex-1" />
            <div className="h-10 bg-slate-200 rounded-xl flex-1" />
          </div>
        </div>
      ))}
    </div>
  );
}
