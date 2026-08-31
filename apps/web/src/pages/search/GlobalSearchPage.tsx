import { useState, useEffect } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { Search, Loader2, SearchX } from 'lucide-react';
import { useGlobalSearch, SearchEntityType } from '../../hooks/useGlobalSearch';
import SearchResultItem from '../../components/global-search/SearchResultItem';
import SearchFilters from '../../components/global-search/SearchFilters';

export default function GlobalSearchPage() {
  const navigate = useNavigate();
  const searchParams = useSearch({ strict: false }) as { q?: string };
  const initialQuery = searchParams.q || '';

  const [query, setQuery] = useState(initialQuery);
  const [page, setPage] = useState(1);
  const [type, setType] = useState<SearchEntityType>('ALL');
  const [sort, setSort] = useState<'relevance' | 'recent'>('relevance');

  const { data, isLoading, isFetching, error } = useGlobalSearch({
    q: query,
    page,
    limit: 20,
    type,
    sort,
    enabled: query.trim().length >= 1,
  });

  useEffect(() => {
    setPage(1);
  }, [query, type, sort]);

  useEffect(() => {
    if (initialQuery && initialQuery !== query) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length >= 1) {
      navigate({ to: '/search', search: { q: trimmed } });
    }
  };

  const items = data?.items || [];
  const pagination = data?.pagination;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Search</h1>
        <p className="text-sm text-slate-500 mt-1">
          Find researchers, projects, equipment, and more across the platform
        </p>
      </div>

      <form onSubmit={handleSubmit} className="relative">
        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for anything..."
          autoFocus
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
        />
      </form>

      {query.trim().length >= 1 && (
        <SearchFilters
          selectedType={type}
          onTypeChange={setType}
          sort={sort}
          onSortChange={setSort}
        />
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-blue-600" />
          <span className="ml-2 text-sm text-slate-500">Searching...</span>
        </div>
      )}

      {!isLoading && error && (
        <div className="text-center py-12">
          <SearchX size={48} className="mx-auto text-slate-300 mb-3" />
          <h3 className="text-lg font-medium text-slate-900 mb-1">Search Error</h3>
          <p className="text-sm text-slate-500">Something went wrong. Please try again.</p>
        </div>
      )}

      {!isLoading && !error && query.trim().length >= 1 && items.length === 0 && (
        <div className="text-center py-12">
          <SearchX size={48} className="mx-auto text-slate-300 mb-3" />
          <h3 className="text-lg font-medium text-slate-900 mb-1">No results found</h3>
          <p className="text-sm text-slate-500">
            Try different keywords or adjust your filters
          </p>
        </div>
      )}

      {!isLoading && !error && query.trim().length < 1 && (
        <div className="text-center py-12">
          <Search size={48} className="mx-auto text-slate-300 mb-3" />
          <h3 className="text-lg font-medium text-slate-900 mb-1">Start searching</h3>
          <p className="text-sm text-slate-500">
            Type a query above to search across researchers, projects, equipment, and more
          </p>
        </div>
      )}

      {items.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              {pagination?.total || 0} result{(pagination?.total || 0) !== 1 ? 's' : ''} found
              {type !== 'ALL' && (
                <span className="ml-1 text-slate-400">
                  in {type.charAt(0) + type.slice(1).toLowerCase()}s
                </span>
              )}
            </p>
            {isFetching && (
              <Loader2 size={14} className="animate-spin text-slate-400" />
            )}
          </div>

          <div className="space-y-3">
            {items.map((result) => (
              <SearchResultItem key={`${result.type}-${result.id}`} result={result} />
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-slate-500">
                Page {page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
