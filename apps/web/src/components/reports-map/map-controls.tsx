import {
  Search,
  Loader2,
  X,
  MapPin,
  HelpCircle,
  Layers,
  Plus,
  Minus,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { STATUS_COLORS } from './map.utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface SearchBoxProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  isSearching: boolean;
  setSearchResults: (val: any[]) => void;
  searchResults: any[];
  onSelect: (lat: number, lon: number, item: any) => void;
}

export function SearchBox({
  searchQuery,
  setSearchQuery,
  isSearching,
  setSearchResults,
  searchResults,
  onSelect,
}: SearchBoxProps) {
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
                onSelect(parseFloat(item.lat), parseFloat(item.lon), item)
              }
            >
              <MapPin className="w-4 h-4 mt-1 text-slate-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">
                  {item.address?.road || item.display_name.split(',')[0]}
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

interface MapControlsProps {
  mapType: 'standard' | 'satellite';
  setMapType: (type: 'standard' | 'satellite') => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export function MapControls({
  mapType,
  setMapType,
  onZoomIn,
  onZoomOut,
}: MapControlsProps) {
  const isMobile = useIsMobile();
  return (
    <div
      className={cn(
        'absolute left-6 z-20 flex flex-col gap-3',
        isMobile ? 'bottom-48' : 'bottom-8',
      )}
    >
      <Popover>
        <PopoverTrigger asChild>
          <Button
            size="icon"
            className="h-10 w-10 rounded-full shadow-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200"
          >
            <HelpCircle className="w-6 h-6" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="left"
          className="w-64 p-4 rounded-xl shadow-2xl mr-2"
        >
          <h4 className="font-bold text-slate-900 mb-1">Instructions</h4>
          <p className="text-sm text-slate-600 mb-4 leading-relaxed">
            Click on the map to select a location. Only locations within the
            municipality borders are allowed.
          </p>
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Report Status
            </p>
            {Object.values(STATUS_COLORS).map((s) => (
              <div key={s.label} className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: s.hex }}
                ></span>
                <span className="text-sm text-slate-700">{s.label}</span>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <Button
        size="icon"
        onClick={() =>
          setMapType(mapType === 'standard' ? 'satellite' : 'standard')
        }
        className={cn(
          'h-10 w-10 rounded-full shadow-xl border transition-colors',
          mapType === 'satellite'
            ? 'bg-blue-600 text-white border-blue-600'
            : 'bg-white text-slate-700 border-slate-200',
        )}
      >
        <Layers className="w-5 h-5" />
      </Button>

      <div className="flex flex-col rounded-full shadow-xl border border-slate-200 bg-white overflow-hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={onZoomIn}
          className="h-10 w-10 rounded-none border-b hover:bg-slate-50"
        >
          <Plus className="w-5 h-5 text-slate-700" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onZoomOut}
          className="h-10 w-10 rounded-none hover:bg-slate-50"
        >
          <Minus className="w-5 h-5 text-slate-700" />
        </Button>
      </div>
    </div>
  );
}
