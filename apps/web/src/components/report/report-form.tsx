import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';

import { Field, FieldLabel } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { useCategories } from '@/hooks/use-categories';
import { useCreateReport } from '@/hooks/use-reports';
import { toast } from 'sonner';
import { ReportData as FormData } from '@/types/report';
import { PhotoUploader } from './photoUploader';

export function ReportForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: categories = [] } = useCategories();
  const createReportMutation = useCreateReport();

  const { register, handleSubmit, setValue, watch } = useForm<FormData>({
    defaultValues: {
      latitude: location.state?.latitude!,
      longitude: location.state?.longitude!,
      address: location.state?.address || '',
      title: '',
      description: '',
      categoryId: '',
      photos: [],
    },
  });

  useEffect(() => {
    if (location.state?.latitude) {
      setValue('latitude', location.state.latitude);
      setValue('longitude', location.state.longitude);
      setValue('address', location.state.address);
    }
  }, [location.state, setValue]);

  const photos = watch('photos');

  const handlePhotosChange = (files: File[]) => {
    setValue('photos', files);
  };

  const onSubmit = async (data: FormData) => {
    if (!data.title) {
      toast.warning('Please insert a title.');
      return;
    }
    if (!data.description) {
      toast.warning('Please write a description.');
      return;
    }
    if (!data.categoryId) {
      toast.warning('Please select a category.');
      return;
    }
    if (data.photos.length < 1 || data.photos.length > 3) {
      toast.warning('You must upload between 1 and 3 images.');
      return;
    }

    try {
      await createReportMutation.mutateAsync(data);
      toast.success('Report created successfully!');
      navigate(-1);
    } catch (error) {
      toast.error('There was an error creating the report.');
      console.error(error);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4 max-w-md w-full mx-auto"
    >
      <Field>
        <FieldLabel>Latitude</FieldLabel>
        <input
          type="number"
          {...register('latitude', { valueAsNumber: true })}
          readOnly
          className="w-full border rounded-md p-3 text-base focus-visible:outline-none bg-gray-100"
        />
      </Field>

      <Field>
        <FieldLabel>Longitude</FieldLabel>
        <input
          type="number"
          {...register('longitude', { valueAsNumber: true })}
          readOnly
          className="w-full border rounded-md p-3 text-base focus-visible:outline-none bg-gray-100"
        />
      </Field>

      <Field>
        <FieldLabel>Address</FieldLabel>
        <input
          {...register('address')}
          readOnly
          className="w-full border rounded-md p-3 text-base focus-visible:outline-none bg-gray-100"
        />
      </Field>

      <Field>
        <FieldLabel>Title</FieldLabel>
        <input
          {...register('title')}
          placeholder="Enter title"
          className="w-full border rounded-md p-3 text-base focus-visible:outline-none"
        />
      </Field>

      <Field>
        <FieldLabel>Description</FieldLabel>
        <textarea
          {...register('description')}
          placeholder="Enter description"
          className="w-full border rounded-md p-3 min-h-[120px] resize-none text-base focus-visible:outline-none"
        />
      </Field>

      <Field>
        <FieldLabel>Category</FieldLabel>
        <Select
          {...register('categoryId')}
          value={watch('categoryId')}
          onValueChange={(value) => setValue('categoryId', value)}
        >
          <SelectTrigger className="w-full border rounded-md p-3 text-base focus-visible:outline-none">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name
                  .replace(/_/g, ' ')
                  .split(' ')
                  .map(
                    (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
                  )
                  .join(' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field>
        <FieldLabel>Photo (JPEG,PNG,WebP)</FieldLabel>
        <PhotoUploader
          photos={photos}
          onChange={handlePhotosChange}
          maxPhotos={3}
        />
      </Field>

      <div className="flex justify-end gap-2 mt-4">
        <Button type="button" variant="outline" onClick={() => navigate(-1)}>
          Cancel
        </Button>
        <Button type="submit">Submit</Button>
      </div>
    </form>
  );
}
