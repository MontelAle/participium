import { ReportContentLayout } from '@/components/reports/report-content-layout';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/auth-context';
import { useCategories } from '@/hooks/use-categories';
import { useExternalMaintainers } from '@/hooks/use-external-maintainers';
import { useOffices } from '@/hooks/use-offices';
import { useUpdateReport } from '@/hooks/use-reports';
import type { Report, ReportStatus, UpdateReportDto } from '@/types';
import { prettifyStatus } from '@/lib/utils';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

export type ViewAssignedReportProps = {
  report: Report;
  showAnonymous?: boolean;
  onClose?: () => void;
};

export function ViewAssignedReport({
  report,
  showAnonymous = true,
  onClose,
}: Readonly<ViewAssignedReportProps>) {
  const { data: offices } = useOffices();
  const { data: externalMaintainers } = useExternalMaintainers();
  const { data: categories } = useCategories();
  const { mutateAsync: updateReportMutation, isPending } = useUpdateReport();

  const externalOffices = offices?.filter((o) => o.isExternal) || [];
  const externalOfficesWithCategory = externalOffices.filter((office) => {
    const category = categories?.find((cat) => cat.id === report.category?.id);
    return category?.externalOffice?.id === office.id;
  });

  const { handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      externalOfficeId: report.assignedExternalMaintainer?.officeId || '',
      status: report.status as ReportStatus,
    },
  });

  const { isTechnicalOfficer, user } = useAuth();

  const allowedNextStatuses = useMemo(() => {
    const getNextStatusOptions = (currentStatus: ReportStatus) => {
      switch (currentStatus) {
        case 'assigned':
          return ['assigned', 'in_progress'];
        case 'in_progress':
          return ['in_progress', 'resolved','suspended'];
        case 'suspended':
          return ['suspended', 'in_progress'];
        case 'resolved':
          return ['resolved'];
        default:
          return [];
      }
    };

    return getNextStatusOptions(report.status as ReportStatus);
  }, [report.status]);

  const handleConfirm = async (data: {
    externalOfficeId: string;
    status?: ReportStatus;
  }) => {
    const selectedExternalMaintainer = externalMaintainers?.find(
      (em) => em.office?.id === data.externalOfficeId,
    );

    const updateData: UpdateReportDto = {
      assignedExternalMaintainerId: selectedExternalMaintainer?.id || '',
      status: data.status,
    };

    try {
      await updateReportMutation({
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

  const selectContent = (
    <div>
      <h4 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">
        External Company
      </h4>
      <div>
        <div className="flex flex-row gap-4">
          <Select
            value={watch('externalOfficeId') ?? ''}
            onValueChange={(v) => setValue('externalOfficeId', v)}
            disabled={report.status !== 'assigned'}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select an external company" />
            </SelectTrigger>

            <SelectContent>
              {externalOfficesWithCategory?.map((office) => (
                <SelectItem key={office.id} value={office.id}>
                  {office.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {watch('externalOfficeId') && report.status === 'assigned' && (
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground z-10"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setValue('externalOfficeId', '');
              }}
            >
              ✕
            </button>
          )}
        </div>
        {/* Status change control for assigned technical officer */}
        {!(
          report.status === 'pending' ||
          report.status === 'resolved' ||
          report.status === 'rejected'
        ) &&
          isTechnicalOfficer &&
          user?.id === report.assignedOfficerId && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                Change Status
              </h4>
              {allowedNextStatuses.length > 0 ? (
                <div className="flex items-center gap-2">
                  <Select
                    value={watch('status')}
                    onValueChange={(v) => setValue('status', v as ReportStatus)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Change status" />
                    </SelectTrigger>
                    <SelectContent>
                      {allowedNextStatuses.map((s) => (
                        <SelectItem key={s} value={s}>
                          {prettifyStatus(s)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No status changes available
                </div>
              )}
            </div>
          )}
      </div>
    </div>
  );

  const externalOfficeValue = watch('externalOfficeId') ?? '';

  const actionButtons = (
    <Button
      type="submit"
      className="h-11 px-8 text-base shadow-lg shadow-primary/20 hover:shadow-primary/40 rounded-lg"
      disabled={
        isPending ||
        ((report.assignedExternalMaintainer?.officeId || '') ===
          externalOfficeValue &&
          report.status === watch('status'))
      }
    >
      Confirm
    </Button>
  );

  return (
    <form className="contents" onSubmit={handleSubmit(handleConfirm)}>
      <ReportContentLayout
        report={report}
        showAnonymous={showAnonymous}
        afterDescriptionContent={selectContent}
        sidebarActions={actionButtons}
      />
    </form>
  );
}
