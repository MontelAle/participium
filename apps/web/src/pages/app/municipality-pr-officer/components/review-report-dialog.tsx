import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import type { Report, UpdateReportDto } from '@repo/api';
import { ReportStatus } from '@repo/api';
import { XIcon } from 'lucide-react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { useCategories } from '@/hooks/use-categories';
import { toast } from 'sonner';
import { useUpdateReport } from '@/hooks/use-reports';

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

  // Conferma disabilitata se lo status è rejected e explanation è vuoto
  const canConfirm = isPending && (!isRejected || explanation.trim() !== '');

  const handleConfirm = async () => {
    if (!canConfirm) return;

    const updateData: UpdateReportDto = {
      status: selectedStatus as ReportStatus,
      categoryId: selectedCategory,
      ...(isRejected && { description: explanation }),
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

          <form className="flex flex-col gap-4">
            {/* Titolo */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                type="text"
                value={report.title}
                readOnly
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-gray-900 bg-gray-100"
              />
            </div>

            {/* Descrizione */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={report.description ?? ''}
                readOnly
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-gray-900 bg-gray-100"
                rows={3}
              />
            </div>

            {/* Indirizzo */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <input
                type="text"
                value={report.address ?? ''}
                readOnly
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-gray-900 bg-gray-100"
              />
            </div>

            {/* Coordinate */}
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">
                  Latitude
                </label>
                <input
                  type="number"
                  value={latitude}
                  readOnly
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-gray-900 bg-gray-100"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">
                  Longitude
                </label>
                <input
                  type="number"
                  value={longitude}
                  readOnly
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-gray-900 bg-gray-100"
                />
              </div>
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Category
              </label>
              {isPending ? (
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                  disabled={isLoading}
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
              ) : (
                <input
                  type="text"
                  value={report.category?.name ?? ''}
                  readOnly
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-gray-900 bg-gray-100"
                />
              )}
            </div>

            {/* Immagini */}
            {report.images && report.images.length > 0 && (
              <div className="mb-4">
                Images:
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

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Status
              </label>
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
                    <SelectItem value={ReportStatus.ASSIGNED}>
                      Assigned
                    </SelectItem>
                    <SelectItem value={ReportStatus.REJECTED}>
                      Rejected
                    </SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <input
                  type="text"
                  value={report.status.replace('_', ' ')}
                  readOnly
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-gray-900 bg-gray-100"
                />
              )}
            </div>

            {/* Explanation solo se rejected */}
            {isPending && isRejected && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Explanation
                </label>
                <textarea
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-gray-900"
                  rows={3}
                  disabled={isLoading}
                />
              </div>
            )}

            {/* Pulsanti chiudi e conferma */}
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
                  onClick={handleConfirm}
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
