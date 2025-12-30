import { ReportContentLayout } from '@/components/reports/report-content-layout';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCategories } from '@/hooks/use-categories';
import { useExternalMaintainers } from '@/hooks/use-external-maintainers';
import { useOffices } from '@/hooks/use-offices';
import { useUpdateReport } from '@/hooks/use-reports';
import type { Report, UpdateReportDto } from '@/types';
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
    },
  });

  const handleConfirm = async (data: { externalOfficeId: string }) => {
    const selectedExternalMaintainer = externalMaintainers?.find(
      (em) => em.office?.id === data.externalOfficeId,
    );

    const updateData: UpdateReportDto = {
      assignedExternalMaintainerId: selectedExternalMaintainer?.id || '',
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
      <div className="relative">
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
            className="absolute right-12 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-10"
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
    </div>
  );

  const actionButtons = (
    <Button
      type="submit"
      className="h-11 px-8 text-base shadow-lg shadow-primary/20 hover:shadow-primary/40 rounded-lg"
      disabled={
        isPending ||
        (report.assignedExternalMaintainer?.officeId || '') ==
          watch('externalOfficeId')
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
