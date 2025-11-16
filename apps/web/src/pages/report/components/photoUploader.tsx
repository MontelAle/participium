
import { useState } from "react";
import { InputGroup, InputGroupInput, InputGroupAddon } from "@/components/ui/input-group";
import { FileIcon } from "lucide-react";

interface PhotoUploaderProps {
  photos: File[];
  onChange: (photos: File[]) => void;
  maxPhotos?: number;
}

export function PhotoUploader({ photos, onChange, maxPhotos = 3 }: PhotoUploaderProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);
    const newPhotos = [...photos, ...filesArray].slice(0, maxPhotos);
    onChange(newPhotos);
  };

  const removePhoto = (index: number) => {
    const updatedPhotos = photos.filter((_, i) => i !== index);
    onChange(updatedPhotos);
  };

  return (
    <div className="flex gap-2 flex-wrap">
      {photos.map((photo, index) => (
        <div key={index} className="relative w-24 h-24 border rounded-md overflow-hidden">
          <img
            src={URL.createObjectURL(photo)}
            alt={`Preview ${index + 1}`}
            className="w-full h-full object-cover"
          />
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
            <InputGroupInput type="file" name="photo" onChange={handleFileChange} />
        </InputGroup>
      )}
    </div>
  );
}
