import { useState, useEffect } from "react";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import { toast } from "sonner";

interface PhotoUploaderProps {
  photos: File[];
  onChange: (photos: File[]) => void;
  maxPhotos?: number;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE_MB = 5;

export function PhotoUploader({ photos, onChange, maxPhotos = 3 }: PhotoUploaderProps) {
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    const objectUrls = photos.map((photo) => URL.createObjectURL(photo));
    setPreviews(objectUrls);

    return () => {
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [photos]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);

    const invalidFiles = filesArray.filter((file) => !ACCEPTED_TYPES.includes(file.type));
    if (invalidFiles.length > 0) {
      toast.error(
        "Invalid file format. Allowed formats are: JPEG , PNG , WebP."
      );
      return;
    }

    const tooLargeFiles = filesArray.filter((file) => file.size > MAX_FILE_SIZE_MB * 1024 * 1024);
    if (tooLargeFiles.length > 0) {
      toast.error(`Each file must be smaller than ${MAX_FILE_SIZE_MB} MB.`);
      return;
    }

    const newPhotos = [...photos, ...filesArray].slice(0, maxPhotos);
    onChange(newPhotos);
  };

  const removePhoto = (index: number) => {
    const updatedPhotos = photos.filter((_, i) => i !== index);
    onChange(updatedPhotos);
  };

  return (
    <div className="flex gap-2 flex-wrap">
      {previews.map((src, index) => (
        <div key={index} className="relative w-24 h-24 border rounded-md overflow-hidden">
          <img src={src} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => removePhoto(index)}
            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
          >
            ✕
          </button>
        </div>
      ))}

      {photos.length < maxPhotos && (
        <InputGroup>
          <InputGroupInput
            type="file"
            name="photo"
            accept=".jpg,.jpeg,.png,.webp"
            onChange={handleFileChange}
          />
        </InputGroup>
      )}
    </div>
  );
}
