/*
import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import type { Report, UpdateReportDto } from '@repo/api';
import { ReportStatus } from '@repo/api';
import { XIcon, UserIcon } from 'lucide-react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Field } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Input } from '@/components/ui/input';
import { useCategories } from '@/hooks/use-categories';
import { toast } from 'sonner';
import { useUpdateReport } from '@/hooks/use-reports';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

type ReviewReportDialogProps = {
  report: Report;
  open: boolean;
  onClose: () => void;
};

export function ReviewReportDialog({
  report,
  open,
  onClose,
}: ReviewReportDialogProps) {
  const { data: categories = [] } = useCategories();
  const updateReportMutation = useUpdateReport();

  const [selectedCategory, setSelectedCategory] = React.useState<string>(
    report.category?.id ?? '',
  );
  const [selectedStatus, setSelectedStatus] = React.useState<string>(
    report.status,
  );
  const [explanation, setExplanation] = React.useState<string>('');

  React.useEffect(() => {
    setSelectedCategory(report.category?.id ?? '');
    setSelectedStatus(report.status);
    setExplanation('');
  }, [report]);

  const latitude = report.location.coordinates[1];
  const longitude = report.location.coordinates[0];

  const isPending = report.status === ReportStatus.PENDING;
  const isRejected = selectedStatus === ReportStatus.REJECTED;
  const isLoading = updateReportMutation.status === 'pending';

  const canConfirm =
    isPending &&
    selectedStatus !== report.status &&
    (!isRejected || explanation.trim() !== '');

  const handleConfirm = async () => {
    if (!canConfirm) return;

    const updateData: UpdateReportDto = {
      status: selectedStatus as ReportStatus,
      categoryId: selectedCategory,
      ...(isRejected && { explanation: explanation }),
    };

    try {
      await updateReportMutation.mutateAsync({
        reportId: report.id,
        data: updateData,
      });
      toast.success('Report updated successfully');
      onClose();
    } catch (err) {
      toast.error('Failed to update report');
      console.error(err);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg w-full max-w-md shadow-lg z-50 overflow-y-auto max-h-[80vh]">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-xl font-bold">
              Report Details
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                aria-label="Close"
                className="p-1 rounded hover:bg-black/5"
                disabled={isLoading}
              >
                <XIcon className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
          >
            <Field>
              <Label htmlFor="title">Title</Label>
              <Input
                name="title"
                placeholder="Title"
                disabled
                value={report.title}
              />
            </Field>
            <Field>
              <Label htmlFor="description">Description</Label>
              <Textarea
                name="description"
                placeholder="Description"
                required
                disabled
                value={report.description ?? ''}
              />
            </Field>
            <Field>
              <Label htmlFor="address">Address</Label>
              <Input
                name="address"
                placeholder="Address"
                required
                value={report.address ?? ''}
                disabled
              />
            </Field>
            <Field>
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                name="latitude"
                placeholder="Latitude"
                required
                value={latitude}
                disabled
              />
            </Field>
            <Field>
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                name="longitude"
                placeholder="Longitude"
                required
                value={longitude}
                disabled
              />
            </Field>

            <Field>
              <Label htmlFor="category">Category</Label>
              <Select
                value={
                  isPending ? selectedCategory : (report.category?.id ?? '')
                }
                onValueChange={setSelectedCategory}
                disabled={!isPending || isLoading}
              >
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {report.images && report.images.length > 0 && (
              <div className="mb-4">
                <Label>Images</Label>
                <div className="mt-2 flex gap-2 overflow-x-auto">
                  {report.images.map((img, index) => (
                    <Dialog.Root key={index}>
                      <Dialog.Trigger asChild>
                        <img
                          src={img}
                          alt={`Image of ${report.title}`}
                          className="h-20 w-20 rounded object-cover flex-shrink-0 cursor-pointer hover:opacity-80 transition"
                        />
                      </Dialog.Trigger>
                      <Dialog.Portal>
                        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
                        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
                          <img
                            src={img}
                            alt={`Image of ${report.title}`}
                            className="max-h-[80vh] max-w-[90vw] rounded shadow-lg"
                          />
                          <Dialog.Close asChild>
                            <button className="absolute top-2 right-2 p-1 rounded bg-black/20 hover:bg-black/40 text-white">
                              ✕
                            </button>
                          </Dialog.Close>
                        </Dialog.Content>
                      </Dialog.Portal>
                    </Dialog.Root>
                  ))}
                </div>
              </div>
            )}

            <Field>
             <Label>Status</Label>
            {isPending ? (
              <Select
                value={selectedStatus}
                onValueChange={setSelectedStatus}
                disabled={isLoading}
              >
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ReportStatus.ASSIGNED}>Assigned</SelectItem>
                  <SelectItem value={ReportStatus.REJECTED}>Rejected</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <span className="block mt-1">{report.status}</span> // mostra qualsiasi valore
            )}
            </Field>

            {(isPending && selectedStatus === ReportStatus.REJECTED) ||
            (!isPending && report.status === ReportStatus.REJECTED) ? (
              <Field>
                <Label htmlFor="explanation">Explanation</Label>
                <Textarea
                  id="explanation"
                  name="explanation"
                  placeholder="Explanation"
                  value={isPending ? explanation : (report.explanation ?? '')}
                  onChange={
                    isPending
                      ? (e) => setExplanation(e.target.value)
                      : undefined
                  }
                  disabled={!isPending || isLoading}
                  rows={3}
                />
              </Field>
            ) : null}

            <div className="flex justify-end mt-4 gap-3">
              <Dialog.Close asChild>
                <Button variant="outline" disabled={isLoading}>
                  Close
                </Button>
              </Dialog.Close>

              {isPending && (
                <Button
                  className="bg-black text-white hover:bg-gray-800"
                  disabled={!canConfirm || isLoading}
                  type="submit"
                >
                  {isLoading ? 'Saving...' : 'Confirm'}
                </Button>
              )}
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
*/import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { Report, UpdateReportDto } from '@repo/api';
import { ReportStatus } from '@repo/api';
import { XIcon, MapPin, Tag, Maximize2, Info } from 'lucide-react';
import { useCategories } from '@/hooks/use-categories';
import { useUpdateReport } from '@/hooks/use-reports';
import { toast } from 'sonner';
import { MiniMap } from '@/components/mini-map';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

type ReviewReportDialogProps = {
  report: Report;
  open: boolean;
  onClose: () => void;
};

type FormData = {
  categoryId: string;
  status: string;
  explanation?: string;
};

export function ReviewReportDialog({ report, open, onClose }: ReviewReportDialogProps) {
  const { data: categories = [] } = useCategories();
  const updateReportMutation = useUpdateReport();

  const [selectedImageIndex, setSelectedImageIndex] = React.useState<number | null>(null);

  const isPending = report.status === ReportStatus.PENDING;
  const isLoading = updateReportMutation.status === 'pending';

  const { register, handleSubmit, watch, setValue } = useForm<FormData>({
    defaultValues: {
      categoryId: report.category?.id ?? '',
      status: report.status,
      explanation: report.explanation ?? '',
    },
  });

  const watchedCategory = watch('categoryId');
  const watchedStatus = watch('status');
  const watchedExplanation = watch('explanation');

  React.useEffect(() => {
    setValue('categoryId', report.category?.id ?? '');
    setValue('status', report.status);
    setValue('explanation', report.explanation ?? '');
  }, [report, setValue]);

  const canConfirm =
    isPending &&
    (watchedStatus !== report.status || watchedCategory !== report.category?.id) &&
    (!(watchedStatus === ReportStatus.REJECTED) || watchedExplanation?.trim() !== '');

  const handleConfirm = async (data: FormData) => {
    if (!canConfirm) return;

    const updateData: UpdateReportDto = {
      status: data.status as ReportStatus,
      categoryId: data.categoryId,
      ...(data.status === ReportStatus.REJECTED && { explanation: data.explanation }),
    };

    try {
      await updateReportMutation.mutateAsync({ reportId: report.id, data: updateData });
      toast.success('Report updated successfully');
      onClose();
    } catch (err) {
      toast.error('Failed to update report');
      console.error(err);
    }
  };

  const latitude = report.location.coordinates[1];
  const longitude = report.location.coordinates[0];
  const reportImages = report.images || [];

  return (
    <Dialog.Root open={open} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl max-h-[90vh] overflow-y-auto z-50">
          <Card className="w-full h-full flex flex-col border-none overflow-hidden bg-white/90 backdrop-blur-sm ring-1 ring-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-xl font-bold">Review Report</Dialog.Title>
              <Dialog.Close asChild>
                <button
                  aria-label="Close"
                  className="p-1 rounded hover:bg-black/5"
                  disabled={isLoading}
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </Dialog.Close>
            </div>

            <form onSubmit={handleSubmit(handleConfirm)} className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full">
              {/* LEFT COLUMN: Info + editable fields */}
              <div className="md:col-span-7 flex flex-col bg-white overflow-y-auto h-full border-b md:border-b-0 md:border-r border-gray-100 p-6 order-2 md:order-1 min-w-0 gap-4">
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Title</h4>
                  <p className="text-xl font-bold text-foreground leading-tight break-words">{report.title}</p>
                </div>

                <Separator className="bg-gray-100" />

                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider flex items-center gap-2">
                    <Tag className="size-3.5" /> Category
                  </h4>
                  {isPending ? (
                    <Select
                      value={watchedCategory}
                      onValueChange={(v) => setValue('categoryId', v)}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name.replaceAll(/_/g, ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-primary/5 text-primary font-medium text-sm border border-primary/10">
                      {report.category?.name || 'Unknown'}
                    </div>
                  )}
                </div>

                {((isPending && watchedStatus === ReportStatus.REJECTED) || report.status === ReportStatus.REJECTED) && (
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Explanation</h4>
                    <Textarea
                      {...register('explanation')}
                      disabled={!isPending || isLoading}
                      rows={3}
                    />
                  </div>
                )}

                <div className="flex-1">
                  <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Description</h4>
                  <div className="bg-gray-50/50 rounded-lg p-4 border text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words min-h-[100px]">
                    {report.description}
                  </div>
                </div>

                <div className="pt-3 mt-auto flex items-center justify-between text-sm text-muted-foreground border-t border-dashed">
                  <p className="truncate">
                    Reported By: <span className="font-medium text-foreground">{report.user?.firstName} {report.user?.lastName}</span>
                  </p>
                  <p className="whitespace-nowrap">
                    Last Updated: <span className="font-medium text-foreground">{new Date(report.updatedAt).toLocaleDateString()}</span>
                  </p>
                </div>
              </div>

              {/* RIGHT COLUMN: Map + Photos + Status */}
              <div className="md:col-span-5 flex flex-col gap-6 overflow-y-auto order-1 md:order-2 p-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col shrink-0">
                  <div className="relative w-full h-56 bg-slate-100">
                    {latitude && longitude ? (
                      <MiniMap latitude={latitude} longitude={longitude} className="rounded-none border-none h-full" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                        Map unavailable
                      </div>
                    )}
                  </div>
                  <div className="p-4 border-t border-gray-100 bg-white space-y-2">
                    <div className="flex items-center gap-2 text-primary/80 mb-1">
                      <MapPin className="size-4" />
                      <span className="text-xs font-bold tracking-widest uppercase">Location</span>
                    </div>
                    <p className="font-semibold text-gray-900 text-base leading-tight truncate">{report.address || 'Address not available'}</p>
                    <p className="text-xs text-gray-500 font-mono">{latitude?.toFixed(6)}, {longitude?.toFixed(6)}</p>
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-base font-semibold text-foreground/80">Status</h3>
                  {isPending ? (
                    <Select
                      value={watchedStatus}
                      onValueChange={(v) => setValue('status', v)}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ReportStatus.ASSIGNED}>Assigned</SelectItem>
                        <SelectItem value={ReportStatus.REJECTED}>Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="block mt-1">{report.status}</span>
                  )}
                </div>

                <div className="flex-1 flex flex-col">
                  <h3 className="mb-3 text-base font-semibold text-foreground/80">Photos ({reportImages.length})</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {reportImages.map((imgUrl, index) => (
                      <div
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        role="button"
                        tabIndex={0}
                        className="group relative aspect-4/3 rounded-lg border bg-background overflow-hidden shadow-sm cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <img src={imgUrl} alt={`Evidence ${index + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <Maximize2 className="text-white opacity-0 group-hover:opacity-100 size-6 drop-shadow-md" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <input type="hidden" {...register('categoryId')} />
              <input type="hidden" {...register('status')} />
            </form>

            <div className="flex justify-end mt-4 gap-3">
              <Dialog.Close asChild>
                <Button variant="outline" disabled={isLoading}>Close</Button>
              </Dialog.Close>
              {isPending && (
                <Button type="submit" disabled={!canConfirm || isLoading} onClick={handleSubmit(handleConfirm)}>
                  {isLoading ? 'Saving...' : 'Confirm'}
                </Button>
              )}
            </div>

            {selectedImageIndex !== null && reportImages.length > 0 && (
              <div
                className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
                onClick={(e) => { if (e.target === e.currentTarget) setSelectedImageIndex(null); }}
              >
                <button
                  onClick={() => setSelectedImageIndex(null)}
                  className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-white/10 rounded-full"
                >
                  <XIcon className="size-8" />
                </button>
                <img
                  src={reportImages[selectedImageIndex]}
                  alt="Enlarged evidence view"
                  className="max-w-full max-h-[85vh] object-contain rounded shadow-2xl"
                />
              </div>
            )}
          </Card>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
} 