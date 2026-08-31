import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Search, X, Clock, ArrowRight } from 'lucide-react';
import { useSearchSuggestions, ENTITY_TYPE_LABELS, ENTITY_TYPE_COLORS } from '../../hooks/useGlobalSearch';

const RECENT_SEARCHES_KEY = 'cese-rlim-recent-searches';
const MAX_RECENT_SEARCHES = 8;

function getRecentSearches(): string[] {
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string) {
  const searches = getRecentSearches().filter((s) => s !== query);
  searches.unshift(query);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches.slice(0, MAX_RECENT_SEARCHES)));
}

function clearRecentSearches() {
  localStorage.removeItem(RECENT_SEARCHES_KEY);
}

interface HeaderSearchProps {
  className?: string;
}

export default function HeaderSearch({ className = '' }: HeaderSearchProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: suggestions = [], isFetching } = useSearchSuggestions({
    q: query,
    enabled: isFocused && query.trim().length >= 2,
  });

  const showDropdown = isFocused && (query.trim().length >= 2 || recentSearches.length > 0);
  const totalItems = recentSearches.length + suggestions.length;

  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [query, suggestions]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmed = query.trim();
    if (trimmed.length >= 1) {
      saveRecentSearch(trimmed);
      setRecentSearches(getRecentSearches());
      setIsFocused(false);
      navigate({ to: '/search', search: { q: trimmed } });
    }
  }, [query, navigate]);

  const handleSelectSuggestion = useCallback((url: string) => {
    setIsFocused(false);
    navigate({ to: url });
  }, [navigate]);

  const handleSelectRecent = useCallback((search: string) => {
    setQuery(search);
    saveRecentSearch(search);
    setRecentSearches(getRecentSearches());
    setIsFocused(false);
    navigate({ to: '/search', search: { q: search } });
  }, [navigate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const selectedSuggestion = selectedIndex >= 0 ? suggestions[selectedIndex] : undefined;
      if (selectedSuggestion) {
        handleSelectSuggestion(selectedSuggestion.url);
      } else {
        handleSubmit();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, totalItems - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === 'Escape') {
      setIsFocused(false);
      inputRef.current?.blur();
    }
  }, [selectedIndex, suggestions, totalItems, handleSubmit, handleSelectSuggestion]);

  const handleClear = useCallback(() => {
    setQuery('');
    setSelectedIndex(-1);
    inputRef.current?.focus();
  }, []);

  const handleClearRecent = useCallback(() => {
    clearRecentSearches();
    setRecentSearches([]);
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search everything..."
          className="w-full pl-9 pr-20 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query && (
            <button
              onClick={handleClear}
              className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium text-slate-400 bg-slate-200 rounded">
            ⌘K
          </kbd>
        </div>
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
          {recentSearches.length > 0 && query.trim().length < 2 && (
            <div className="p-2">
              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Recent</span>
                <button
                  onClick={handleClearRecent}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              </div>
              {recentSearches.map((search, idx) => (
                <button
                  key={search}
                  onClick={() => handleSelectRecent(search)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-left transition-colors ${
                    selectedIndex === idx ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Clock size={14} className="text-slate-400 flex-shrink-0" />
                  <span className="truncate">{search}</span>
                </button>
              ))}
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="p-2">
              {query.trim().length >= 2 && (
                <div className="flex items-center justify-between px-2 py-1">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Suggestions</span>
                  <button
                    onClick={handleSubmit}
                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    View all <ArrowRight size={10} />
                  </button>
                </div>
              )}
              {suggestions.map((suggestion, idx) => {
                const adjustedIdx = recentSearches.length + idx;
                return (
                  <button
                    key={`${suggestion.type}-${suggestion.id}`}
                    onClick={() => handleSelectSuggestion(suggestion.url)}
                    className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left transition-colors ${
                      selectedIndex === adjustedIdx ? 'bg-slate-100' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium flex-shrink-0 ${ENTITY_TYPE_COLORS[suggestion.type] || 'bg-slate-100 text-slate-600'}`}>
                      {ENTITY_TYPE_LABELS[suggestion.type] || suggestion.type}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-slate-900 truncate">{suggestion.title}</div>
                      {suggestion.subtitle && (
                        <div className="text-xs text-slate-500 truncate">{suggestion.subtitle}</div>
                      )}
                    </div>
                    <ArrowRight size={14} className="text-slate-300 flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          )}

          {query.trim().length >= 2 && suggestions.length === 0 && !isFetching && (
            <div className="p-4 text-center text-sm text-slate-500">
              No results found for "{query}"
            </div>
          )}

          {isFetching && query.trim().length >= 2 && (
            <div className="p-4 text-center text-sm text-slate-400">
              Searching...
            </div>
          )}

          {query.trim().length >= 2 && (
            <div className="border-t border-slate-100 p-2">
              <button
                onClick={handleSubmit}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                View all results for "{query}"
                <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
