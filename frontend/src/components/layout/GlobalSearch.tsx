import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, CornerDownLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface GlobalSearchProps {
  className?: string;
  onSearchComplete?: () => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ className, onSearchComplete }) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = query.trim().toUpperCase();
      if (!trimmed) return;

      // Navigate directly to investigations with the real ticker
      navigate(`/investigations?ticker=${encodeURIComponent(trimmed)}`);
      onSearchComplete?.();
    },
    [query, navigate, onSearchComplete]
  );

  const handleClear = () => {
    setQuery('');
  };

  return (
    <form
      onSubmit={handleSearch}
      className={cn('relative w-full max-w-md', className)}
      role="search"
    >
      <div
        className={cn(
          'flex h-10 w-full items-center rounded-xl border border-border bg-surface px-3 py-1.5 transition-all duration-200 shadow-sm',
          isFocused
            ? 'border-accent bg-surface ring-2 ring-accent/20'
            : 'hover:border-border-subtle hover:bg-surface/90'
        )}
      >
        <Search className="h-4 w-4 shrink-0 text-secondary-foreground/70 mr-2.5" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value.toUpperCase())}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Lookup ticker (e.g. BBCA, TLKM, ASII)..."
          className="w-full bg-transparent text-sm text-foreground placeholder:text-secondary-foreground/60 focus:outline-none uppercase tracking-wider font-mono font-medium"
          maxLength={10}
          aria-label="Stock ticker search"
        />

        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="mr-1.5 rounded p-0.5 text-secondary-foreground/60 hover:bg-surface-hover hover:text-white"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        <button
          type="submit"
          disabled={!query.trim()}
          className={cn(
            'flex h-6 items-center gap-1 rounded-md px-1.5 text-[11px] font-medium transition-colors select-none',
            query.trim()
              ? 'bg-accent text-white hover:bg-accent-hover cursor-pointer shadow-sm'
              : 'bg-secondary-light/60 text-secondary-foreground/50 border border-border/40 pointer-events-none'
          )}
          title="Submit ticker lookup"
        >
          <span className="hidden sm:inline">Lookup</span>
          <CornerDownLeft className="h-3 w-3" />
        </button>
      </div>
    </form>
  );
};

export default GlobalSearch;
