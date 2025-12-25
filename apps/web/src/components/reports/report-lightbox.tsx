import { Button } from '@/components/ui/button';
import { ReportLightboxProps } from '@/types/ui';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useCallback, useEffect } from 'react';

export function ReportLightbox({
  images,
  selectedIndex,
  onClose,
  onIndexChange,
}: Readonly<ReportLightboxProps>) {
  const isOpen = selectedIndex !== null && images.length > 0;
  const currentIndex = selectedIndex ?? 0;

  const handleNext = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      onIndexChange((currentIndex + 1) % images.length);
    },
    [currentIndex, images.length, onIndexChange],
  );

  const handlePrev = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      onIndexChange((currentIndex - 1 + images.length) % images.length);
    },
    [currentIndex, images.length, onIndexChange],
  );

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, handleNext, handlePrev]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image gallery"
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 text-white/70 hover:text-white hover:bg-white/10 rounded-full z-[60] h-12 w-12"
        onClick={onClose}
        aria-label="Close gallery"
      >
        <X className="size-8" />
      </Button>

      {images.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white hover:bg-white/10 rounded-full h-12 w-12 hidden md:flex z-[60]"
            onClick={handlePrev}
            aria-label="Previous image"
          >
            <ChevronLeft className="size-8" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white hover:bg-white/10 rounded-full h-12 w-12 hidden md:flex z-[60]"
            onClick={handleNext}
            aria-label="Next image"
          >
            <ChevronRight className="size-8" />
          </Button>
        </>
      )}

      <div
        className="relative w-full h-full flex items-center justify-center p-4 md:p-12"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={images[currentIndex]}
          alt={`Evidence ${currentIndex + 1} of ${images.length}`}
          className="max-w-full max-h-full object-contain rounded shadow-2xl select-none"
        />

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 backdrop-blur-md rounded-full text-white text-sm font-medium border border-white/10">
          {currentIndex + 1} / {images.length}
        </div>
      </div>
    </div>
  );
}
