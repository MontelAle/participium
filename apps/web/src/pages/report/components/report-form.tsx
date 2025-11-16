import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Field, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useCategories } from "@/hooks/use-categories";
import { PhotoUploader } from "./photoUploader";

export function ReportForm() {
  const navigate = useNavigate();
  const { data: categories = [] } = useCategories();

  const [form, setForm] = useState({
    title: "",
    description: "",
    categoryId: "",
    photos: [] as File[],
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCategoryChange = (value: string) => {
    setForm({ ...form, categoryId: value });
  };

  const handlePhotosChange = (photos: File[]) => {
    setForm({ ...form, photos });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Submit is disabled for now", form);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md w-full mx-auto">
      
      {/* Title */}
      <Field>
        <FieldLabel>Title</FieldLabel>
        <input
          name="title"
          placeholder="Enter title"
          required
          value={form.title}
          onChange={handleChange}
          className="w-full border rounded-md p-3 text-base focus-visible:outline-none"
        />
      </Field>

      {/* Description */}
      <Field>
        <FieldLabel>Description</FieldLabel>
        <textarea
          name="description"
          placeholder="Enter description"
          required
          value={form.description}
          onChange={handleChange}
          className="w-full border rounded-md p-3 min-h-[120px] resize-none text-base focus-visible:outline-none"
        />
      </Field>

      {/* Category */}
      <Field>
        <FieldLabel>Category</FieldLabel>
        <Select value={form.categoryId} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-full border rounded-md p-3 text-base focus-visible:outline-none">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name
                  .replace(/_/g, " ")
                  .split(" ")
                  .map(
                    (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
                  )
                  .join(" ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {/* Photos */}
      <Field>
        <FieldLabel>Photo (1-3)</FieldLabel>
        <PhotoUploader
          photos={form.photos}
          onChange={handlePhotosChange}
          maxPhotos={3}
        />
      </Field>

      {/* Buttons */}
      <div className="flex justify-end gap-2 mt-4">
        <Button type="button" variant="outline" onClick={() => navigate(-1)}>
          Cancel
        </Button>

        <Button type="submit">
          Submit
        </Button>
      </div>
    </form>
  );
}
