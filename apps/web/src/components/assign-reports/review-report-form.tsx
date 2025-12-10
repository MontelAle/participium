import { MiniMap } from '@/components/mini-map';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useCategories } from '@/hooks/use-categories';
import { useMunicipalityUsers } from '@/hooks/use-municipality-users';
import { useUpdateReport } from '@/hooks/use-reports';
import type { Report, UpdateReportDto, User } from '@repo/api';
import { ReportStatus } from '@repo/api';
import {
  CalendarClock,
  MapPin,
  Maximize2,
  Tag,
  UserIcon,
  XIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

type ReviewReportFormProps = {
  report: Report;
  onClose?: () => void;
};

type FormData = {
  categoryId: string;
  action: 'accept' | 'reject' | '';
  explanation?: string;
  technicalOfficerId?: string;
};

export function ReviewReportForm({ report, onClose }: ReviewReportFormProps) {
  const { data: categories = [] } = useCategories();
  const { data: municipalityUsers = [] } = useMunicipalityUsers();

  const updateReportMutation = useUpdateReport();

  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null,
  );
  const [explanation, setExplanation] = useState<string>(
    report.explanation ?? '',
  );
  const [competentOfficeName, setCompetentOfficeName] = useState<string>(
    report.category?.office?.name ?? 'Unknown',
  );

  const isPending = report.status === ReportStatus.PENDING;
  const isLoading = updateReportMutation.status === 'pending';

  const { register, handleSubmit, watch, setValue } = useForm<FormData>({
    defaultValues: {
      categoryId: report.category?.id ?? '',
      action: '',
      explanation: report.explanation ?? '',
      technicalOfficerId: report.assignedOfficerId ?? '',
    },
  });

  const watchedCategory = watch('categoryId');
  const watchedAction = watch('action');
  const watchedOfficer = watch('technicalOfficerId');

  useEffect(() => {
    setValue('categoryId', report.category?.id ?? '');
    setValue('action', '');
    setExplanation(report.explanation ?? '');
    setValue('technicalOfficerId', report.assignedOfficerId ?? '');
    setCompetentOfficeName(report.category?.office?.name ?? 'Unknown');
  }, [report, setValue]);

  useEffect(() => {
    const selectedCategory = categories.find(
      (cat) => cat.id === watchedCategory,
    );
    setCompetentOfficeName(selectedCategory?.office?.name ?? 'Unknown');
  }, [watchedCategory, categories]);

  const filteredOfficers = useMemo(() => {
    const cat = categories.find((c) => c.id === watchedCategory);
    if (!cat?.office?.id) return [];
    return municipalityUsers.filter((u: User) => u.officeId === cat.office.id);
  }, [municipalityUsers, categories, watchedCategory]);

  const canConfirm =
    isPending &&
    ((watchedAction === 'reject' && explanation.trim() !== '') ||
      watchedAction === 'accept');

  const handleConfirm = async (data: FormData) => {
    if (!canConfirm) return;

    const updateData: UpdateReportDto = {
      status:
        data.action === 'reject'
          ? ReportStatus.REJECTED
          : ReportStatus.ASSIGNED,
      categoryId: data.categoryId,
      ...(data.action === 'reject' && {
        explanation: explanation,
      }),
      ...(data.action === 'accept' && {
        assignedOfficerId: data.technicalOfficerId || '',
      }),
    };

    try {
      await updateReportMutation.mutateAsync({
        reportId: report.id,
        data: updateData,
      });
      toast.success('Report updated successfully');
      if (onClose) onClose();
    } catch (err) {
      toast.error('Failed to update report');
      console.error(err);
    }
  };

  const latitude = report.location.coordinates[1];
  const longitude = report.location.coordinates[0];
  const reportImages = report.images || [];

  return (
    <Card className="w-full h-full flex flex-col border-none overflow-hidden bg-white/90 backdrop-blur-sm ring-1 ring-gray-200">
      <form
        onSubmit={handleSubmit(handleConfirm)}
        className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full"
      >
        <div className="md:col-span-7 p-6 flex flex-col bg-white overflow-y-auto h-full border-b md:border-b-0 md:border-r border-gray-100 order-2 md:order-1 min-w-0">
          <div className="space-y-4 flex-1 flex flex-col min-w-0">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">
                Title
              </h4>
              <p className="text-xl font-bold text-foreground leading-tight break-words">
                {report.title}
              </p>
            </div>
            <Separator className="bg-gray-100" />
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider flex items-center gap-2">
                Category
              </h4>
              {isPending ? (
                <Select
                  value={watchedCategory}
                  onValueChange={(v) => setValue('categoryId', v)}
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-full">
                    <div className="flex items-center gap-3">
                      <Tag className="size-4 text-muted-foreground" />
                      <SelectValue placeholder="Select category" />
                    </div>
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
                <div className="inline-flex items-center px-3 py-2 rounded-lg bg-purple-50 text-purple-700 font-medium text-sm border border-purple-200 w-fit">
                  <Tag className="size-4 mr-2" />
                  {report.category?.name || 'Unknown'}
                </div>
              )}
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider flex items-center gap-2">
                Competent Office
              </h4>
              <div className="inline-flex items-center px-3 py-2 rounded-lg bg-blue-50 text-blue-700 font-medium text-sm border border-blue-200 w-fit">
                <svg
                  className="size-4 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                {competentOfficeName}
              </div>
            </div>
            <div className="w-full">
              <h4 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                Description
              </h4>
              <div className="bg-gray-50/50 rounded-lg p-4 border text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words w-full min-h-[100px]">
                {report.description}
              </div>
            </div>
            {!isPending && report.status === ReportStatus.ASSIGNED && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider flex items-center gap-2">
                  <UserIcon className="size-3.5 text-slate-500 shrink-0" />
                  Assigned Technical Officer
                </h4>
                <div className="inline-flex items-center px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 font-medium text-sm border border-emerald-200 w-fit">
                  <svg
                    className="size-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {municipalityUsers.find(
                    (u) => u.id === report.assignedOfficerId,
                  )
                    ? `${municipalityUsers.find((u) => u.id === report.assignedOfficerId)!.firstName} ${municipalityUsers.find((u) => u.id === report.assignedOfficerId)!.lastName}`
                    : 'Not assigned'}
                </div>
              </div>
            )}
            {isPending && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                  Decision
                </h4>
                <Select
                  value={watchedAction}
                  onValueChange={(v) =>
                    setValue('action', v as 'accept' | 'reject')
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="accept">Accept</SelectItem>
                    <SelectItem value="reject">Reject</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {isPending && watchedAction === 'accept' && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                  Technical Officer (Optional)
                </h4>
                <Select
                  value={watchedOfficer}
                  onValueChange={(v) => setValue('technicalOfficerId', v)}
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Auto-assign to officer with fewest reports" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredOfficers.map((u: User) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.firstName} {u.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty to automatically assign to the officer with the
                  fewest assigned reports in this office
                </p>
              </div>
            )}
            {isPending && watchedAction === 'reject' && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                  Rejection Reason
                </h4>
                <Textarea
                  {...register('explanation')}
                  value={explanation}
                  onChange={(e) => {
                    setExplanation(e.target.value);
                    setValue('explanation', e.target.value);
                  }}
                  disabled={isLoading}
                  rows={3}
                  placeholder="Please provide a reason for rejecting this report"
                />
              </div>
            )}
            {!isPending && report.status === ReportStatus.REJECTED && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm animate-in fade-in w-full">
                <h4 className="text-sm font-semibold text-red-900 mb-2 uppercase tracking-wider">
                  Rejection Reason
                </h4>
                <div className="text-red-800 whitespace-pre-wrap break-words leading-relaxed">
                  {explanation}
                </div>
              </div>
            )}
            <div className="flex-1 min-h-[80px]"></div>
            <div className="pt-4 flex flex-wrap items-center justify-between gap-4 border-t border-dashed w-full">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest hidden sm:inline-block shrink-0">
                  Reported By
                </span>
                <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-medium text-sm truncate">
                  <UserIcon className="size-3.5 text-slate-500 shrink-0" />
                  <span className="capitalize truncate max-w-[120px]">
                    {report.user.firstName} {report.user.lastName}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest hidden sm:inline-block text-right">
                  Last Updated
                </span>
                <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-gray-50 border border-gray-200 text-gray-600 font-medium text-sm">
                  <CalendarClock className="size-3.5 text-gray-400" />
                  <span>
                    {new Date(report.updatedAt).toLocaleDateString(undefined, {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="md:col-span-5 flex flex-col overflow-y-auto order-1 md:order-2 p-6">
          <div className="flex flex-col gap-6 flex-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col shrink-0">
              <div className="relative w-full h-56 bg-slate-100">
                {latitude && longitude ? (
                  <MiniMap
                    latitude={latitude}
                    longitude={longitude}
                    className="rounded-none border-none h-full"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                    Map unavailable
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-gray-100 bg-white space-y-2">
                <div className="flex items-center gap-2 text-primary/80 mb-1">
                  <MapPin className="size-4" />
                  <span className="text-xs font-bold tracking-widest uppercase">
                    Location
                  </span>
                </div>
                <p className="font-semibold text-gray-900 text-base leading-tight truncate">
                  {report.address || 'Address not available'}
                </p>
                <p className="text-xs text-gray-500 font-mono">
                  {latitude?.toFixed(6)}, {longitude?.toFixed(6)}
                </p>
              </div>
            </div>
            <div className="flex flex-col">
              <h3 className="mb-3 text-base font-semibold text-foreground/80">
                Photos ({reportImages.length})
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {reportImages.map((imgUrl, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedImageIndex(index)}
                    className="group relative aspect-4/3 rounded-lg border bg-background overflow-hidden shadow-sm cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <img
                      src={imgUrl}
                      alt={`Evidence ${index + 1}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <Maximize2 className="text-white opacity-0 group-hover:opacity-100 size-6 drop-shadow-md" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
          {isPending && (
            <div className="pt-6 flex justify-end min-h-[76px]">
              <Button
                type="submit"
                disabled={!canConfirm || isLoading}
                className="h-11 px-8 text-base shadow-lg shadow-primary/20 hover:shadow-primary/40 rounded-lg"
              >
                {isLoading ? 'Saving...' : 'Confirm'}
              </Button>
            </div>
          )}
        </div>
        <input type="hidden" {...register('categoryId')} />
      </form>
      {selectedImageIndex !== null && reportImages.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setSelectedImageIndex(null)}
            className="absolute inset-0 w-full h-full cursor-default"
            aria-label="Close image viewer"
          />
          <button
            type="button"
            onClick={() => setSelectedImageIndex(null)}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-white/10 rounded-full z-10"
            aria-label="Close"
          >
            <XIcon className="size-8" />
          </button>
          <img
            src={reportImages[selectedImageIndex]}
            alt="Enlarged evidence view"
            className="max-w-full max-h-[85vh] object-contain rounded shadow-2xl relative z-10 pointer-events-none"
          />
        </div>
      )}
    </Card>
  );
}
