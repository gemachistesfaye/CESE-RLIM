import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Link } from '@tanstack/react-router';

interface GlobalErrorPageProps {
  error?: Error;
  reset?: () => void;
}

export default function GlobalErrorPage({ error, reset }: GlobalErrorPageProps) {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
        <AlertTriangle size={36} />
      </div>
      <span className="text-sm font-semibold tracking-wider text-red-600 uppercase mb-2">System Error</span>
      <h1 className="text-3xl font-bold text-slate-900 mb-3">Something Went Wrong</h1>
      <p className="text-slate-500 max-w-md mb-4 text-sm leading-relaxed">
        An unexpected error occurred while loading this page. Our team has been notified.
      </p>

      {error?.message && (
        <div className="max-w-lg w-full bg-slate-100 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 font-mono mb-8 overflow-x-auto text-left">
          {error.message}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={() => (reset ? reset() : window.location.reload())}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors shadow-sm"
        >
          <RefreshCw size={16} />
          Try Again
        </button>
        <Link
          to="/"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <Home size={16} />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
