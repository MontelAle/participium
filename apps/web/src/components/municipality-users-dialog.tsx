// components/AddUserDialog.tsx
import { useState } from 'react';
import { MunicipalityUserForm } from './municipality-users-form';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import type { User } from '@repo/api';

interface AddUserDialogProps {
  onCreate: (user: User) => void;
}

export function MunicipalityUsersDialog({ onCreate }: AddUserDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSubmit = async (data: {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    password: string;
  }) => {
    const newUser: User = {
      id: Date.now().toString(),
      username: data.username,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role: {
        id: data.role,
        name: data.role,
      },
      roleId: data.role,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    onCreate(newUser);
    setOpen(false);
    return { success: true };
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
            onCancel={() => {
              setOpen(false);
            }}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
