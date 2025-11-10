import * as React from 'react';
import { Button } from '@/components/ui/button';
import * as Dialog from '@radix-ui/react-dialog';
import { Trash2 } from 'lucide-react';
import type { User } from '@repo/api';

export function DeleteUserDialog({
  user,
  onConfirm,
}: {
  user: User;
  onConfirm: (id: string) => void;
}) {
  const [open, setOpen] = React.useState(false);

  const handleConfirm = () => {
    onConfirm(user.id);
    setOpen(false);
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
            Conferma Eliminazione
          </Dialog.Title>
          <p className="mb-4">
            Sei sicuro di voler eliminare l’utente <strong>{user.username}</strong>?
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirm}>
              Delete
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
