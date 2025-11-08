// components/AddUserDialog.tsx
import { useState } from 'react';
import { MunicipalityUserForm } from './municipality-users-form';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import type { User, Role } from '@repo/api';
import type { CreateMunicipalityUserDto } from '@repo/api';
import { AddUserDialogProps } from '@/types/ui';

export function MunicipalityUsersDialog({
  onCreate,
  roles,
}: AddUserDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSubmit = async (data: CreateMunicipalityUserDto) => {
    try {
      const result = await onCreate(data);
      setOpen(false);
      return result;
    } catch (error) {
      throw error;
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button>Add User</Button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg w-full max-w-lg shadow-lg z-50">
          <Dialog.Title className="text-xl font-bold mb-4">
            Create Municipality User
          </Dialog.Title>

          <MunicipalityUserForm
            onSubmit={handleSubmit}
            roles={roles}
            onCancel={() => {
              setOpen(false);
            }}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
