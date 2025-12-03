import { cn } from '@/lib/utils';
import { Camera, Plus, UploadCloud, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface PhotoUploaderProps {
  photos: File[];
  onChange: (photos: File[]) => void;
  maxPhotos?: number;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_MB = 5;

export function PhotoUploader({
  photos,
  onChange,
  maxPhotos = 3,
}: PhotoUploaderProps) {
  const [previews, setPreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const objectUrls = photos.map((photo) => URL.createObjectURL(photo));
    setPreviews(objectUrls);
    return () => objectUrls.forEach((url) => URL.revokeObjectURL(url));
  }, [photos]);

  const processFiles = useCallback(
    (filesArray: File[]) => {
      const invalidFiles = filesArray.filter(
        (file) => !ACCEPTED_TYPES.includes(file.type),
      );
      if (invalidFiles.length > 0) {
        toast.error('Invalid format. Please use JPEG, PNG or WebP.');
        return;
      }

      const tooLargeFiles = filesArray.filter(
        (file) => file.size > MAX_FILE_SIZE_MB * 1024 * 1024,
      );
      if (tooLargeFiles.length > 0) {
        toast.error(`Each file must be smaller than ${MAX_FILE_SIZE_MB} MB.`);
        return;
      }

      const availableSlots = maxPhotos - photos.length;
      if (filesArray.length > availableSlots) {
        toast.warning(`You can only add ${availableSlots} more photos.`);
      }

      const newPhotos = [...photos, ...filesArray].slice(0, maxPhotos);
      onChange(newPhotos);
    },
    [photos, maxPhotos, onChange],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(Array.from(e.target.files));
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
      e.dataTransfer.clearData();
    }
  };

  const removePhoto = (index: number) => {
    onChange(photos.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      triggerInput();
    }
  };

  const triggerInput = () => inputRef.current?.click();

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        {previews.map((src, index) => (
          <div
            key={index}
            className="group relative aspect-4/3 rounded-xl border bg-background overflow-hidden shadow-sm animate-in zoom-in-50 duration-300"
          >
            <img
              src={src}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => removePhoto(index)}
              className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 hover:bg-destructive transition-all opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}

        {photos.length < maxPhotos && (
          <div
            onClick={triggerInput}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            role="button"
            tabIndex={0}
            onKeyDown={handleKeyDown}
            className={cn(
              'aspect-4/3 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 ease-out flex flex-col items-center justify-center gap-3 p-4 outline-none focus-visible:ring-2 focus-visible:ring-primary',
              isDragging
                ? 'border-primary bg-primary/10 scale-[0.98]'
                : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5 bg-white/50',
              photos.length === 0 && 'col-span-2 aspect-auto py-10 md:py-14',
            )}
          >
            <div
              className={cn(
                'p-3.5 rounded-full shadow-sm border transition-transform duration-300',
                isDragging
                  ? 'bg-primary text-white scale-110'
                  : 'bg-white text-primary group-hover:scale-110',
              )}
            >
              {isDragging ? (
                <UploadCloud className="size-7" />
              ) : photos.length === 0 ? (
                <Camera className="size-7" />
              ) : (
                <Plus className="size-6" />
              )}
            </div>

            <div className="text-center space-y-1">
              <span
                className={cn(
                  'text-sm md:text-base font-semibold block',
                  isDragging ? 'text-primary' : 'text-foreground/80',
                )}
              >
                {isDragging
                  ? 'Drop files here'
                  : photos.length === 0
                    ? 'Upload Photos'
                    : 'Add More'}
              </span>
              {photos.length === 0 && (
                <span className="text-xs md:text-sm text-muted-foreground block">
                  Click or Drag & Drop here
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
