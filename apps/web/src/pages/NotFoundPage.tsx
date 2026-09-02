import { Link } from '@tanstack/react-router';
import { Compass, ArrowLeft, Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
        <Compass size={36} />
      </div>
      <span className="text-sm font-semibold tracking-wider text-blue-600 uppercase mb-2">404 Error</span>
      <h1 className="text-3xl font-bold text-slate-900 mb-3">Page Not Found</h1>
      <p className="text-slate-500 max-w-md mb-8 text-sm leading-relaxed">
        The page you are looking for doesn't exist, has been moved, or you may not have permission to view it.
      </p>

      <div className="flex items-center gap-3">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft size={16} />
          Go Back
        </button>
        <Link
          to="/"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors shadow-sm"
        >
          <Home size={16} />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
