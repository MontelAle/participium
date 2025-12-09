import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { MapSearchBoxProps } from '@/types';
import { Loader2, MapPin, Search, X } from 'lucide-react';

export function SearchBox({
  searchQuery,
  setSearchQuery,
  isSearching,
  setSearchResults,
  searchResults,
  onSelect,
}: MapSearchBoxProps) {
  return (
    <div className="absolute top-4 left-4 z-20 w-[calc(100%-2rem)] max-w-sm flex flex-col gap-2 font-sans">
      <div className="relative flex items-center w-full bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/50 transition-all">
        <div className="pl-3 text-slate-400">
          {isSearching ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Search className="w-5 h-5" />
          )}
        </div>
        <Input
          className="border-0 shadow-none focus-visible:ring-0 h-12 text-base bg-transparent placeholder:text-slate-400"
          placeholder="Search address..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <Button
            type="button"
            variant="ghost"
            className="h-8 w-8 p-0 mr-2 rounded-full"
            onClick={() => {
              setSearchQuery('');
              setSearchResults([]);
            }}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
      {searchResults.length > 0 && (
        <div className="bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden animate-in slide-in-from-top-2 max-h-[300px] overflow-y-auto">
          {searchResults.map((item, i) => (
            <button
              key={i}
              className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b last:border-0 flex items-start gap-3 transition-colors"
              onClick={() =>
                onSelect(
                  Number.parseFloat(item.lat),
                  Number.parseFloat(item.lon),
                  item,
                )
              }
            >
              <MapPin className="w-4 h-4 mt-1 text-slate-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">
                  {item.address?.address.road ||
                    item.display_name.split(',')[0]}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {item.display_name}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
