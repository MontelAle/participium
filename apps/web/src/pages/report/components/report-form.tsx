import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Field, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from "@/components/ui/input-group";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";

import { FileIcon } from "lucide-react";

import { useCategories } from "@/hooks/use-categories";

export function ReportForm() {
  const navigate = useNavigate();
  const { data: categories = [] } = useCategories();

  const [form, setForm] = useState({
    title: "",
    description: "",
    categoryId: "",
    photo: null as File | null,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCategoryChange = (value: string) => {
    setForm({ ...form, categoryId: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, photo: e.target.files?.[0] || null });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Submit is disabled for now", form);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-sm">
      
      {/* Title */}
      <Field>
        <FieldLabel>Title</FieldLabel>
        <InputGroup>
          <InputGroupInput
            name="title"
            placeholder="Enter title"
            required
            value={form.title}
            onChange={handleChange}
          />
        </InputGroup>
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
          className="w-full border rounded-md p-3 min-h-[100px] resize-none focus-visible:outline-none"
        />
      </Field>

      {/* Category */}
      <Field>
        <FieldLabel>Category</FieldLabel>
        <Select value={form.categoryId} onValueChange={handleCategoryChange}>
          <SelectTrigger className="InputGroupInput">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name
                  .replace(/_/g, " ")
                  .split(" ")
                  .map(
                    (w) =>
                      w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
                  )
                  .join(" ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {/* Photo */}
      <Field>
        <FieldLabel>Photo</FieldLabel>
        <InputGroup>
          <InputGroupInput type="file" name="photo" onChange={handleFileChange} />
          <InputGroupAddon>
            <FileIcon />
          </InputGroupAddon>
        </InputGroup>
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
