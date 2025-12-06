import { Button } from '@/components/ui/button';
import { useDeleteMunicipalityUser } from '@/hooks/use-municipality-users';
import * as Dialog from '@radix-ui/react-dialog';
import type { User } from '@repo/api';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

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
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-red-600 hover:bg-red-50"
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-8 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-2xl">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="rounded-full bg-red-100 p-3 text-red-600">
              <AlertTriangle className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <Dialog.Title className="text-2xl font-bold tracking-tight">
                Delete User?
              </Dialog.Title>
              <Dialog.Description className="text-base text-muted-foreground">
                Are you sure you want to delete <strong>{user.username}</strong>
                ? <br />
                This action cannot be undone.
              </Dialog.Description>
            </div>
          </div>

          <div className="mt-6 flex justify-center gap-3 w-full">
            <Dialog.Close asChild>
              <Button
                variant="outline"
                size="lg"
                className="flex-1 text-base"
                disabled={isLoading}
              >
                Cancel
              </Button>
            </Dialog.Close>
            <Button
              variant="destructive"
              size="lg"
              className="flex-1 text-base"
              onClick={handleConfirm}
              disabled={isLoading}
            >
              {isLoading ? 'Deleting...' : 'Delete User'}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
