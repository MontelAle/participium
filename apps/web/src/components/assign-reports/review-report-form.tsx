import { ReportContentLayout } from '@/components/reports/report-content-layout';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCategories } from '@/hooks/use-categories';
import { useMunicipalityUsers } from '@/hooks/use-municipality-users';
import { useUpdateReport } from '@/hooks/use-reports';
import type { UpdateReportDto, User } from '@/types';
import { ReviewReportFormProps } from '@/types/ui';
import { Tag, UserIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

type FormData = {
  categoryId: string;
  action: 'accept' | 'reject' | 'start' | '';
  explanation?: string;
  technicalOfficerId?: string;
};

export function ReviewReportForm({
  report,
  onClose,
}: Readonly<ReviewReportFormProps>) {
  const { data: categories = [] } = useCategories();
  const { data: municipalityUsers = [] } = useMunicipalityUsers();
  const updateReportMutation = useUpdateReport();

  const [explanation, setExplanation] = useState<string>(
    report.explanation ?? '',
  );
  const [competentOfficeName, setCompetentOfficeName] = useState<string>(
    report.category?.office?.name ?? 'Unknown',
  );

  const isPending = report.status === 'pending';
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
      watchedAction === 'accept' ||
      watchedAction === 'start');

  const handleConfirm = async (data: FormData) => {
    if (!canConfirm) return;

    const updateData: UpdateReportDto = {
      status:
        data.action === 'reject'
          ? 'rejected'
          : data.action === 'start'
          ? 'in_progress'
          : 'assigned',
      categoryId: data.categoryId,
      ...(data.action === 'reject' && { explanation: explanation }),
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

  const categoryContent = isPending ? (
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
            {cat.name.replaceAll('_', ' ')}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  ) : undefined;

  const afterCategoryContent = (
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
  );

  const formLogicContent = (
    <>
      {!isPending && report.status === 'assigned' && (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider flex items-center gap-2">
            <UserIcon className="size-3.5 text-slate-500 shrink-0" />
            Assigned Technical Officer
          </h4>
          <div className="inline-flex items-center px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 font-medium text-sm border border-emerald-200 w-fit">
            {municipalityUsers.find((u) => u.id === report.assignedOfficerId)
              ? `${municipalityUsers.find((u) => u.id === report.assignedOfficerId)!.firstName} ${municipalityUsers.find((u) => u.id === report.assignedOfficerId)!.lastName}`
              : 'Not assigned'}
          </div>
        </div>
      )}

      {isPending && (
        <div className="space-y-4">
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

          {watchedAction === 'accept' && (
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

          {watchedAction === 'reject' && (
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
        </div>
      )}
    </>
  );

  const actionButtons = isPending ? (
    <Button
      type="submit"
      disabled={!canConfirm || isLoading}
      className="h-11 px-8 text-base shadow-lg shadow-primary/20 hover:shadow-primary/40 rounded-lg"
    >
      {isLoading ? 'Saving...' : 'Confirm'}
    </Button>
  ) : null;

  return (
    <form className="contents" onSubmit={handleSubmit(handleConfirm)}>
      <input type="hidden" {...register('categoryId')} />

      <ReportContentLayout
        report={report}
        categoryOverride={categoryContent}
        afterCategoryContent={afterCategoryContent}
        afterDescriptionContent={formLogicContent}
        sidebarActions={actionButtons}
      />
    </form>
  );
}
