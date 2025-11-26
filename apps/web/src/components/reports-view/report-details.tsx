import { useState } from 'react';
import {
  MapPin,
  Tag,
  Maximize2,
  X,
  Info,
  Ghost,
  User,
  CalendarClock,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { Report } from '@repo/api';
import { MiniMap } from '@/components/mini-map';

interface ReportDetailsProps {
  report: Report;
}

export function ReportDetails({ report }: ReportDetailsProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null,
  );
  const reportImages = report.images || [];

  const latitude = report.location?.coordinates?.[1];
  const longitude = report.location?.coordinates?.[0];

  return (
    <>
      <Card className="w-full h-full flex flex-col border-none overflow-hidden bg-white/90 backdrop-blur-sm ring-1 ring-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-12 h-full">
          <div className="md:col-span-7 p-6 flex flex-col bg-white overflow-y-auto h-full border-b md:border-b-0 md:border-r border-gray-100 order-2 md:order-1 min-w-0">
            <div className="space-y-4 flex-1 flex flex-col min-w-0">
              {' '}
              <div className="w-full">
                {' '}
                <h4 className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">
                  Title
                </h4>
                <p className="text-xl font-bold text-foreground leading-tight break-words w-full">
                  {report.title}
                </p>
              </div>
              <Separator className="bg-gray-100" />
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider flex items-center gap-2">
                  Category
                </h4>
                <div className="inline-flex items-center px-3 py-2 rounded-lg bg-purple-50 text-purple-700 font-medium text-sm border border-purple-200 w-fit">
                  <Tag className="size-4 mr-2" />
                  {report.category?.name || 'Unknown'}
                </div>
              </div>
              {report.explanation && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm animate-in fade-in w-full">
                  <div className="flex gap-2">
                    <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                    <div className="space-y-0.5 w-full">
                      {' '}
                      <h5 className="font-semibold text-amber-900">
                        Admin Note
                      </h5>
                      <p className="text-amber-800 leading-relaxed break-words">
                        {report.explanation}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex-1 w-full">
                {' '}
                <h4 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                  Description
                </h4>
                <div className="bg-gray-50/50 rounded-lg p-4 border text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words w-full min-h-[100px]">
                  {report.description}
                </div>
              </div>
              <div className="pt-4 mt-auto flex items-center justify-between gap-4 border-t border-dashed w-full">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest hidden sm:inline-block shrink-0">
                    Reported By
                  </span>
                  {report.user ? (
                    <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-medium text-sm truncate">
                      <User className="size-3.5 text-slate-500 shrink-0" />
                      <span className="capitalize truncate max-w-[120px]">
                        {report.user.firstName} {report.user.lastName}
                      </span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-700 font-medium text-sm italic shrink-0">
                      <Ghost className="size-3.5 shrink-0" />
                      <span>Anonymous</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest hidden sm:inline-block text-right">
                    Last Updated
                  </span>
                  <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-gray-50 border border-gray-200 text-gray-600 font-medium text-sm">
                    <CalendarClock className="size-3.5 text-gray-400" />
                    <span>
                      {new Date(report.updatedAt).toLocaleDateString(
                        undefined,
                        {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        },
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-5 p-6 flex flex-col gap-6 overflow-y-auto order-1 md:order-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col shrink-0">
              <div className="relative w-full h-56 bg-slate-100">
                {latitude && longitude ? (
                  <MiniMap
                    latitude={latitude}
                    longitude={longitude}
                    status={report.status}
                    className="rounded-none border-none h-full"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                    Map unavailable
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-gray-100 bg-white space-y-2">
                <div className="flex items-center gap-2 text-primary/80 mb-1">
                  <MapPin className="size-4" />
                  <span className="text-xs font-bold tracking-widest uppercase">
                    Location
                  </span>
                </div>
                <p className="font-semibold text-gray-900 text-base leading-tight truncate">
                  {report.address || 'Address not available'}
                </p>
                <p className="text-xs text-gray-500 font-mono">
                  {latitude?.toFixed(6)}, {longitude?.toFixed(6)}
                </p>
              </div>
            </div>

            <div className="flex flex-col">
              <h3 className="mb-3 text-base font-semibold text-foreground/80">
                Photos ({reportImages.length})
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {reportImages.map((imgUrl, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedImageIndex(index);
                      }
                    }}
                    className="group relative aspect-4/3 rounded-lg border bg-background overflow-hidden shadow-sm cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <img
                      src={imgUrl}
                      alt={`Evidence ${index + 1}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <Maximize2 className="text-white opacity-0 group-hover:opacity-100 size-6 drop-shadow-md" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {selectedImageIndex !== null && reportImages.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedImageIndex(null);
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Close preview"
          onKeyDown={(e) => {
            if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setSelectedImageIndex(null);
            }
          }}
        >
          <button
            onClick={() => setSelectedImageIndex(null)}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-white/10 rounded-full focus:outline-none focus:ring-2 focus:ring-white"
          >
            <X className="size-8" />
          </button>
          <img
            src={reportImages[selectedImageIndex]}
            alt="Enlarged evidence view"
            className="max-w-full max-h-[85vh] object-contain rounded shadow-2xl"
          />
        </div>
      )}
    </>
  );
}
