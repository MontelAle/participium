import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { MapPin, Type, FileText, Tag } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { useCategories } from '@/hooks/use-categories';
import { useCreateReport } from '@/hooks/use-reports';
import { toast } from 'sonner';
import { ReportData as FormData } from '@/types/report';
import { PhotoUploader } from './photoUploader.js';
import { MiniMap } from '@/components/mini-map'; // Path corretto

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
    if (!location.state?.latitude) {
      toast.warning('Please select a location on the map first.');
      navigate('/report-map');
    } else {
      setValue('latitude', location.state.latitude);
      setValue('longitude', location.state.longitude);
      setValue('address', location.state.address);
    }
  }, [location.state, setValue, navigate]);

  const photos = watch('photos');
  const handlePhotosChange = (files: File[]) => setValue('photos', files);

  const onSubmit = async (data: FormData) => {
    if (!data.title) return toast.warning('Please enter a title.');
    if (!data.description)
      return toast.warning('Please provide a description.');
    if (!data.categoryId) return toast.warning('Please select a category.');
    if (data.photos.length < 1 || data.photos.length > 3)
      return toast.warning('Please upload between 1 and 3 photos.');

    try {
      await createReportMutation.mutateAsync(data);
      toast.success('Report submitted successfully!');
      navigate(-1);
    } catch (error) {
      toast.error('Error submitting the report.');
      console.error(error);
    }
  };

  return (
    <Card className="w-full h-full flex flex-col border-none overflow-hidden bg-white/90 backdrop-blur-sm ring-1 ring-gray-200">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex-1 flex flex-col md:flex-row h-full overflow-hidden"
      >
        <div className="w-full md:w-7/12 p-6 md:p-6 flex flex-col bg-white overflow-y-auto border-b md:border-b-0 md:border-r border-gray-100 order-2 md:order-1 min-w-0">
          <div className="space-y-6 flex-1">
            <Field>
              <FieldLabel className="mb-2 ml-1 text-base font-medium">
                Title
              </FieldLabel>
              <InputGroup className="bg-gray-50/50 focus-within:bg-white transition-colors shadow-sm">
                <InputGroupInput
                  {...register('title')}
                  placeholder="Title of the report"
                  className="h-12 text-base"
                />
                <InputGroupAddon>
                  <Type className="size-5 text-muted-foreground" />
                </InputGroupAddon>
              </InputGroup>
            </Field>

            <Field>
              <FieldLabel className="mb-2 ml-1 text-base font-medium">
                Category
              </FieldLabel>
              <Select
                value={watch('categoryId')}
                onValueChange={(value) => setValue('categoryId', value)}
              >
                <SelectTrigger className="w-full h-12 text-base bg-gray-50/50 focus:bg-white shadow-sm">
                  <div className="flex items-center gap-3">
                    <Tag className="size-4 text-muted-foreground" />
                    <SelectValue placeholder="Select category" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem
                      key={cat.id}
                      value={cat.id}
                      className="text-base py-3 cursor-pointer"
                    >
                      {cat.name.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field className="flex-1 flex flex-col min-h-[180px]">
              <FieldLabel className="mb-2 ml-1 text-base font-medium">
                Description
              </FieldLabel>
              <div className="relative flex-1">
                <textarea
                  {...register('description')}
                  placeholder="Describe the problem in detail..."
                  className="w-full h-full min-h-[150px] rounded-xl border border-input bg-gray-50/50 pl-4 pr-12 py-3 text-base focus:bg-white shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none leading-relaxed"
                />
                <FileText className="absolute top-4 right-4 size-5 text-muted-foreground/50 pointer-events-none" />
              </div>
            </Field>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 mt-4 border-t border-dashed">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate(-1)}
              className="h-11 px-6 text-base hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-11 px-8 text-base shadow-lg shadow-primary/20 hover:shadow-primary/40 rounded-lg"
            >
              Submit Report
            </Button>
          </div>
        </div>

        <div className="w-full md:w-5/12 p-6 border-b md:border-b-0 flex flex-col gap-6 overflow-y-auto order-1 md:order-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col shrink-0">
            <div className="relative w-full h-56 bg-slate-100">
              {watch('latitude') && watch('longitude') ? (
                <MiniMap
                  latitude={watch('latitude')}
                  longitude={watch('longitude')}
                  className="rounded-none border-none h-full"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  Select location
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-100 bg-white space-y-1">
              <div className="flex items-center gap-2 text-primary/80 mb-1">
                <MapPin className="size-4" />
                <span className="text-xs font-bold tracking-widest uppercase">
                  Location
                </span>
              </div>
              <p className="font-semibold text-gray-900 text-base leading-tight truncate">
                {watch('address') || 'Address not available'}
              </p>
              <p className="text-xs text-gray-500 font-mono">
                {watch('latitude')?.toFixed(6)},{' '}
                {watch('longitude')?.toFixed(6)}
              </p>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-[140px]">
            <FieldLabel className="mb-3 text-base font-semibold text-foreground/80">
              Photos (Max 3)
            </FieldLabel>
            <div className="flex-1">
              <PhotoUploader
                photos={photos}
                onChange={handlePhotosChange}
                maxPhotos={3}
              />
            </div>
          </div>
        </div>

        <input type="hidden" {...register('latitude')} />
        <input type="hidden" {...register('longitude')} />
        <input type="hidden" {...register('address')} />
      </form>
    </Card>
  );
}
