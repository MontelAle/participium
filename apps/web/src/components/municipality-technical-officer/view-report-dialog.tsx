import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { XIcon, MapPin, Tag, Maximize2 } from 'lucide-react';
import { MiniMap } from '@/components/mini-map';
import { Input } from '@/components/ui/input';
import { useCategories } from '@/hooks/use-categories';

import type { Report } from '@repo/api';
import { useAuth } from '@/contexts/auth-context';

type ViewReportDialogProps = {
  report: Report;
  open: boolean;
  onClose: () => void;
};

export function ViewReportDialog({ report, open, onClose }: ViewReportDialogProps) {
  //const { data: categories = [] } = useCategories();
  const [selectedImageIndex, setSelectedImageIndex] = React.useState<number | null>(null);
  const { user } = useAuth();

  
  //const selectedCategory = categories.find(cat => cat.id === report.category?.id);
  const categoryName = report.category?.name || 'Unknown';
  const competentOfficeName = user?.office?.name || 'Unknown';

  const latitude = report.location.coordinates[1];
  const longitude = report.location.coordinates[0];
  const reportImages = report.images || [];

  return (
    <Dialog.Root open={open} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl max-h-[90vh] overflow-y-auto z-50">
          <Card className="w-full h-full flex flex-col border-none overflow-hidden bg-white/90 backdrop-blur-sm ring-1 ring-gray-200 p-6">

            {/* HEADER */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Report Details</h2>
              <Dialog.Close asChild>
                <button aria-label="Close" className="p-1 rounded hover:bg-black/5">
                  <XIcon className="w-5 h-5" />
                </button>
              </Dialog.Close>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full">

              {/* LEFT PANEL */}
              <div className="md:col-span-7 flex flex-col bg-white overflow-y-auto h-full border-b md:border-b-0 md:border-r border-gray-100 p-6 order-2 md:order-1 min-w-0 gap-4">
                
                {/* Title */}
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Title</h4>
                  <p className="text-xl font-bold text-foreground leading-tight break-words">{report.title}</p>
                </div>

                <Separator className="bg-gray-100" />

                {/* Category */}
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider flex items-center gap-2">
                    <Tag className="size-3.5" /> Category
                  </h4>
                  <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-primary/5 text-primary font-medium text-sm border border-primary/10">
                    {categoryName}
                  </div>

                  {/* Competent Office */}
                  <div className="mt-2">
                    <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Competent Office</h4>
                    <Input value={competentOfficeName} readOnly />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Description</h4>
                  <div className="bg-gray-50/50 rounded-lg p-4 border text-sm text-gray-700 whitespace-pre-wrap break-words min-h-[100px]">
                    {report.description}
                  </div>
                </div>

                {/* Footer left panel */}
                <div className="pt-3 mt-auto flex items-center justify-between text-sm text-muted-foreground border-t border-dashed">
                  <p className="truncate">
                    Reported By: <span className="font-medium text-foreground">{report.user?.firstName} {report.user?.lastName}</span>
                  </p>
                  <p className="whitespace-nowrap">
                    Last Updated: <span className="font-medium text-foreground">{new Date(report.updatedAt).toLocaleDateString()}</span>
                  </p>
                </div>
              </div>

              {/* RIGHT PANEL */}
              <div className="md:col-span-5 flex flex-col gap-6 overflow-y-auto order-1 md:order-2 p-6">

                {/* Map */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col shrink-0">
                  <div className="relative w-full h-56 bg-slate-100">
                    {latitude && longitude ? (
                      <MiniMap latitude={latitude} longitude={longitude} className="rounded-none border-none h-full" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                        Map unavailable
                      </div>
                    )}
                  </div>
                  <div className="p-4 border-t border-gray-100 bg-white space-y-2">
                    <div className="flex items-center gap-2 text-primary/80 mb-1">
                      <MapPin className="size-4" />
                      <span className="text-xs font-bold tracking-widest uppercase">Location</span>
                    </div>
                    <p className="font-semibold text-gray-900 text-base leading-tight truncate">{report.address || 'Address not available'}</p>
                    <p className="text-xs text-gray-500 font-mono">{latitude?.toFixed(6)}, {longitude?.toFixed(6)}</p>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <h3 className="mb-3 text-base font-semibold text-foreground/80">Status</h3>
                  <span className="block mt-1">{report.status}</span>
                </div>

                {/* Photos */}
                <div className="flex-1 flex flex-col">
                  <h3 className="mb-3 text-base font-semibold text-foreground/80">Photos ({reportImages.length})</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {reportImages.map((imgUrl, index) => (
                      <div
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        role="button"
                        tabIndex={0}
                        className="group relative aspect-4/3 rounded-lg border bg-background overflow-hidden shadow-sm cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <img src={imgUrl} alt={`Evidence ${index + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <Maximize2 className="text-white opacity-0 group-hover:opacity-100 size-6 drop-shadow-md" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            {/* Enlarged image view */}
            {selectedImageIndex !== null && reportImages.length > 0 && (
              <div
                className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
                onClick={(e) => { if (e.target === e.currentTarget) setSelectedImageIndex(null); }}
              >
                <button
                  onClick={() => setSelectedImageIndex(null)}
                  className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-white/10 rounded-full"
                >
                  <XIcon className="size-8" />
                </button>
                <img
                  src={reportImages[selectedImageIndex]}
                  alt="Enlarged evidence view"
                  className="max-w-full max-h-[85vh] object-contain rounded shadow-2xl"
                />
              </div>
            )}

          </Card>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
