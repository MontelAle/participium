import { Button } from '@/components/ui/button';
import * as Dialog from '@radix-ui/react-dialog';
import { Trash2 } from 'lucide-react';
import type { User } from '@repo/api';
import { toast } from 'sonner';
import { useDeleteMunicipalityUser } from '@/hooks/use-municipality-users';
import { useState } from 'react';

export function DeleteMunicipalityUserDialog({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { mutateAsync: deleteMunicipalUser } = useDeleteMunicipalityUser();

  const handleConfirm = async () => {
    setIsLoading(true);

    try {
      await deleteMunicipalUser(user.id);
      toast.success(`User "${user.username}" deleted successfully!`);
      setOpen(false);
    } catch (err: any) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="ghost" size="icon">
          <Trash2 className="h-4 w-4 text-red-600" />
        </Button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-lg z-50 w-full max-w-sm">
          <Dialog.Title className="text-lg font-bold mb-2">
            Confirm Deletion
          </Dialog.Title>
          <p className="mb-4">
            Are you sure you want to delete user{' '}
            <strong>{user.username}</strong>?
          </p>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={isLoading}
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
