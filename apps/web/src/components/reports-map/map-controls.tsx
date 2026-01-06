import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import type { MapControlsProps } from '@/types';
import { HelpCircle, Layers, Minus, Plus } from 'lucide-react';
import { STATUS_COLORS } from './map.utils';

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
        'absolute left-6 z-20 flex flex-col',
        isMobile ? 'bottom-48' : 'bottom-8',
      )}
    >
      <div className="mb-6">
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
              {Object.values(STATUS_COLORS)
                .filter((s) => !['Pending', 'Rejected'].includes(s.label))
                .map((s) => (
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
      </div>

      <div className="flex flex-col gap-3">
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
    </div>
  );
}
