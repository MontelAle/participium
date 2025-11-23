import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { MapPin, Type, FileText, Tag, Send } from 'lucide-react';

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

  const handlePhotosChange = (files: File[]) => {
    setValue('photos', files);
  };

  const onSubmit = async (data: FormData) => {
    if (!data.title) return toast.warning('Please enter a title.');
    if (!data.description)
      return toast.warning('Please provide a description.');
    if (!data.categoryId) return toast.warning('Please select a category.');
    if (data.photos.length < 1 || data.photos.length > 3) {
      return toast.warning('Please upload between 1 and 3 photos.');
    }

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
    <Card className="w-full border-none shadow-2xl overflow-hidden bg-white/90 backdrop-blur-sm ring-1 ring-gray-200">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-auto lg:min-h-[600px]">
          <div className="lg:col-span-5 bg-muted/30 p-6 lg:p-10 border-b lg:border-b-0 lg:border-r flex flex-col gap-6 lg:gap-10">
            <div className="bg-white p-5 lg:p-6 rounded-2xl shadow-sm border border-gray-100 space-y-3 lg:space-y-4">
              <div className="flex items-center gap-3 text-primary mb-1">
                <MapPin className="size-4 lg:size-5" />
                <span className="text-xs lg:text-sm font-bold tracking-widest uppercase">
                  Detected Location
                </span>
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg lg:text-2xl leading-tight mb-2 wrap-break-words">
                  {watch('address') || 'Address not available'}
                </p>
                <p className="text-xs lg:text-sm text-gray-500 font-mono bg-gray-100 inline-block px-2 py-1 rounded">
                  {watch('latitude')?.toFixed(6)},{' '}
                  {watch('longitude')?.toFixed(6)}
                </p>
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              <FieldLabel className="mb-3 lg:mb-4 text-base lg:text-lg font-semibold text-foreground/80">
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

          <div className="lg:col-span-7 p-6 lg:p-10 flex flex-col gap-6 lg:gap-8 bg-white">
            <div className="space-y-6 lg:space-y-8 flex-1">
              <Field>
                <FieldLabel className="mb-2 ml-1 text-base lg:text-lg font-medium">
                  Title
                </FieldLabel>
                <InputGroup className="bg-gray-50/50 focus-within:bg-white transition-colors shadow-sm">
                  <InputGroupInput
                    {...register('title')}
                    placeholder="Title"
                    className="h-12 lg:h-14 text-base lg:text-lg"
                  />
                  <InputGroupAddon>
                    <Type className="size-5 lg:size-6 text-muted-foreground" />
                  </InputGroupAddon>
                </InputGroup>
              </Field>

              <Field>
                <FieldLabel className="mb-2 ml-1 text-base lg:text-lg font-medium">
                  Category
                </FieldLabel>
                <Select
                  value={watch('categoryId')}
                  onValueChange={(value) => setValue('categoryId', value)}
                >
                  <SelectTrigger className="w-full h-12 lg:h-14 text-base lg:text-lg bg-gray-50/50 focus:bg-white shadow-sm">
                    <div className="flex items-center gap-3">
                      <Tag className="size-4 lg:size-5 text-muted-foreground" />
                      <SelectValue placeholder="Select category" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem
                        key={cat.id}
                        value={cat.id}
                        className="text-base lg:text-lg py-2 lg:py-3 cursor-pointer"
                      >
                        {cat.name
                          .replace(/_/g, ' ')
                          .split(' ')
                          .map(
                            (w) =>
                              w.charAt(0).toUpperCase() +
                              w.slice(1).toLowerCase(),
                          )
                          .join(' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input type="hidden" {...register('categoryId')} />
              </Field>

              <Field className="flex-1 flex flex-col">
                <FieldLabel className="mb-2 ml-1 text-base lg:text-lg font-medium">
                  Description
                </FieldLabel>
                <div className="relative flex-1">
                  <textarea
                    {...register('description')}
                    placeholder="Description"
                    className="w-full h-full min-h-[180px] lg:min-h-[200px] rounded-xl border border-input bg-gray-50/50 px-4 lg:px-5 py-3 lg:py-4 text-base lg:text-lg focus:bg-white shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none leading-relaxed"
                  />
                  <FileText className="absolute top-4 right-4 size-5 lg:size-6 text-muted-foreground/50 pointer-events-none" />
                </div>
              </Field>
            </div>

            <div className="flex items-center justify-end gap-3 lg:gap-4 pt-4 lg:pt-6 mt-auto border-t lg:border-t-0 border-dashed">
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate(-1)}
                className="h-11 lg:h-12 px-6 lg:px-8 text-base lg:text-lg hover:bg-muted"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-11 lg:h-12 px-6 lg:px-10 text-base lg:text-lg gap-2 lg:gap-3 shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all rounded-xl"
              >
                Submit Report
              </Button>
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
