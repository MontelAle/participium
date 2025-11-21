import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import type { Report } from '@repo/api';
import { XIcon } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useCategories } from '@/hooks/use-categories';

type ReviewReportDialogProps = {
  report: Report;
  open: boolean;
  onClose: () => void;
};

export function ReviewReportDialog({ report, open, onClose }: ReviewReportDialogProps) {
  const { data: categories = [] } = useCategories();
  const [selectedCategory, setSelectedCategory] = React.useState<string>(report.category?.id ?? '');

  React.useEffect(() => {
    setSelectedCategory(report.category?.id ?? '');
  }, [report]);

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
  };

  const latitude = report.location.coordinates[1];
  const longitude = report.location.coordinates[0];

  // Funzione per determinare il colore del badge in base allo status
  const getStatusClasses = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'closed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg w-full max-w-md shadow-lg z-50 overflow-y-auto max-h-[80vh]">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-xl font-bold">Report Details</Dialog.Title>
            <Dialog.Close asChild>
              <button aria-label="Close" className="p-1 rounded hover:bg-black/5">
                <XIcon className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Titolo */}
          <div className="mb-2 text-lg">
            <strong>Title: </strong> {report.title}
          </div>

          {/* Descrizione */}
          <div className="mb-2 text-base">
            <strong>Description: </strong> {report.description ?? 'No description'}
          </div>

          {/* Indirizzo */}
          <div className="mb-2 text-base">
            <strong>Address: </strong> {report.address ?? 'No address'}
          </div>

          {/* Coordinate */}
          <div className="mb-2 text-base">
            <strong>Latitude: </strong> {latitude}
          </div>
          <div className="mb-4 text-base">
            <strong>Longitude: </strong> {longitude}
          </div>

          {/* Categoria modificabile */}
          <div className="mb-4">
            <strong>Category: </strong>
            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
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
          </div>

          {/* Immagini */}
          {/* Immagini */}
{report.images && report.images.length > 0 && (
  <div className="mb-4">
    <strong>Images:</strong>
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
          <div className="mb-4">
            <strong>Status: </strong>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStatusClasses(
                report.status,
              )}`}
            >
              {report.status.replace('_', ' ')}
            </span>
          </div>

          {/* Pulsante chiudi */}
          <div className="flex justify-end mt-4">
            <Dialog.Close asChild>
              <Button variant="outline">Close</Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
