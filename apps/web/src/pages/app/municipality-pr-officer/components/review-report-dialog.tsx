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
              <Label htmlFor="status">Status</Label>
              <Select
                value={isPending ? selectedStatus : report.status}
                onValueChange={setSelectedStatus}
                disabled={!isPending || isLoading}
              >
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ReportStatus.ASSIGNED}>
                    Assigned
                  </SelectItem>
                  <SelectItem value={ReportStatus.REJECTED}>
                    Rejected
                  </SelectItem>
                </SelectContent>
              </Select>
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
