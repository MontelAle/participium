'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import * as Dialog from '@radix-ui/react-dialog';
import type { User, Role } from '@repo/api';
import { EditUserForm } from './edit-municiapality-user-form';
import { Pencil } from 'lucide-react';

interface EditUserDialogProps {
  user: User;
  roles: Role[];
  onSuccess: () => void;
}

export function EditUserDialog({ user, roles, onSuccess }: EditUserDialogProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="ghost" size="icon">
          {/* Matita */}
          <Pencil className="h-4 w-4" />
        </Button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-lg z-50 w-full max-w-md">
          <Dialog.Title className="text-lg font-bold mb-2">
            Edit User
          </Dialog.Title>

          <EditUserForm
            user={user}
            roles={roles}
            onSuccess={() => {
              onSuccess();
              setOpen(false);
            }}
          />

          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
