import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface GlobalSearchProps {
  className?: string;
  onSearchComplete?: () => void;
}

/**
 * Global ticker search.
 * Radius: 0.25rem. Uses a single accent submit affordance; the field itself
 * stays neutral and signals focus with a visible ring.
 */
export const GlobalSearch: React.FC<GlobalSearchProps> = ({ className, onSearchComplete }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = query.trim().toUpperCase();
      if (!trimmed) return;

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
      <div className="flex h-12 w-full items-center rounded-[0.25rem] border border-border bg-primary px-3 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground mr-2.5" aria-hidden="true" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value.toUpperCase())}
          placeholder="Search ticker (e.g. BBCA, TLKM)"
          className="w-full bg-transparent text-base text-foreground placeholder:text-muted-foreground focus:outline-none uppercase font-mono"
          maxLength={10}
          aria-label="Stock ticker search"
        />

        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="mr-1.5 rounded-[0.25rem] p-1.5 text-muted-foreground hover:bg-surface-hover hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        <button
          type="submit"
          disabled={!query.trim()}
          className={cn(
            'flex h-8 items-center rounded-[0.25rem] px-3 text-sm font-bold transition-colors select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
            query.trim()
              ? 'bg-accent text-white hover:bg-accent-hover cursor-pointer'
              : 'bg-secondary-light text-muted-foreground cursor-not-allowed'
          )}
          aria-label="Submit ticker lookup"
        >
          Lookup
        </button>
      </div>
    </form>
  );
};

export default GlobalSearch;
