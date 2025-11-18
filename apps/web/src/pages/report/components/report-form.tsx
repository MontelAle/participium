import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

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
import { useCreateReport } from "@/hooks/use-reports";
import { toast } from "sonner";

export function ReportForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: categories = [] } = useCategories();
  const createReportMutation = useCreateReport();

  const [form, setForm] = useState(() => ({
    latitude: location.state?.latitude || "",
    longitude: location.state?.longitude || "",
    address: location.state?.address || "",
    title: "",
    description: "",
    categoryId: "",
    photos: [] as File[],
  }));

  useEffect(() => {
    if (location.state?.latitude) {
      setForm((prev) => ({
        ...prev,
        latitude: location.state.latitude,
        longitude: location.state.longitude,
        address: location.state.address,
      }));
    }
  }, [location.state]);

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

const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  if (!form.title) {
    toast.warning("Please insert a title.");
    return;
  }

  if (!form.description) {
    toast.warning("Please write a description.");
    return;
  }

  if (!form.categoryId) {
    toast.warning("Please select a category.");
    return;
  }

  if (form.photos.length < 1 || form.photos.length > 3) {
    toast.warning("You must upload between 1 and 3 images.");
    return;
  }

  try {
    await createReportMutation.mutateAsync({
      ...form,
      photos: form.photos,
    });

    toast.success("Report created successfully!");
    navigate(-1);

  } catch (error) {
    toast.error("There was an error creating the report.");
    console.error(error);
  }
};

  


  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 max-w-md w-full mx-auto"
    >

      {/* Latitude */}
      <Field>
        <FieldLabel>Latitude</FieldLabel>
        <input
          name="latitude"
          placeholder="Enter latitude"
          required
          value={form.latitude}
          readOnly   
          className="w-full border rounded-md p-3 text-base focus-visible:outline-none bg-gray-100"
        />
        </Field>

      {/* Longitude */}
      <Field>
        <FieldLabel>Longitude</FieldLabel>
        <input
          name="longitude"
          placeholder="Enter longitude"
          required
          value={form.longitude}
          readOnly
          className="w-full border rounded-md p-3 text-base focus-visible:outline-none bg-gray-100"
        />
      </Field>

      {/* Address */}
      <Field>
        <FieldLabel>Address</FieldLabel>
        <input
          name="address"
          placeholder="Enter address"
          required
          value={form.address}
          readOnly
          className="w-full border rounded-md p-3 text-base focus-visible:outline-none bg-gray-100"
        />
      </Field>


      {/* Title */}
      <Field>
        <FieldLabel>Title</FieldLabel>
        <input
          name="title"
          placeholder="Enter title"
          //required
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
          //required
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
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                  .join(" ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {/* Photos */}
      <Field>
        <FieldLabel>Photo (JPEG,PNG,WebP)</FieldLabel>
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

        <Button type="submit">Submit</Button>
      </div>
    </form>
  );
}
