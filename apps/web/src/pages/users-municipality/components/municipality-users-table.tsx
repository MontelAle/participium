'use client';

import * as React from 'react';
import {
  TableProvider,
  TableHeader,
  TableHeaderGroup,
  TableRow,
  TableCell,
  TableColumnHeader,
  TableBody,
} from '@/components/ui/shadcn-io/table';
import type { User } from '@repo/api';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';

export function MunicipalityUsersTable({ users }: { users: User[] }) {
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setSelectedUser(null);
    setIsDialogOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!selectedUser) return;

    // TODO: uncomment and implement deletion
    /*
    deleteMunicipalityUser(selectedUser.id)
      .then(() => {
        // Optional: remove user from local state to update table
        setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
        closeDeleteDialog();
      })
      .catch(err => console.error('Error deleting user:', err));
    */

    console.log('Confirmed delete for user', selectedUser.id);
    closeDeleteDialog();
  };

  const columns = React.useMemo(
    () => [
      {
        accessorKey: 'username',
        header: 'Username',
      },
      {
        accessorKey: 'email',
        header: 'Email',
      },
      {
        accessorKey: 'firstName',
        header: 'First Name',
      },
      {
        accessorKey: 'lastName',
        header: 'Last Name',
      },
      {
        accessorKey: 'role',
        header: 'Role',
        cell: ({ getValue }: any) =>
          typeof getValue() === 'object' ? getValue().name : getValue(),
      },
      {
        id: 'operations',
        header: 'Operations',
        cell: ({ row }: any) => {
          const user = row.original as User;
          return (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => console.log('Edit user', user.id)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => openDeleteDialog(user)}
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          );
        },
      },
    ],
    [],
  );

  return (
    <>
      <TableProvider columns={columns} data={users}>
        <TableHeader>
          {({ headerGroup }) => (
            <TableHeaderGroup headerGroup={headerGroup}>
              {({ header }) => (
                <TableColumnHeader
                  column={header.column}
                  title={header.column.columnDef.header as string}
                />
              )}
            </TableHeaderGroup>
          )}
        </TableHeader>

        <TableBody>
          {({ row }) => (
            <TableRow row={row}>
              {({ cell }) => <TableCell cell={cell} />}
            </TableRow>
          )}
        </TableBody>
      </TableProvider>

      {/* Delete User Dialog */}
      <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-lg z-50 w-full max-w-sm">
            <Dialog.Title className="text-lg font-bold mb-2">
              Confirm Deletion
            </Dialog.Title>
            <p className="mb-4">
              Are you sure you want to delete user{' '}
              <strong>{selectedUser?.username}</strong>?
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeDeleteDialog}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleConfirmDelete}>
                Confirm
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

