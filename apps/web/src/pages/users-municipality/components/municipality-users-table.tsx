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
import type { User, Role } from '@repo/api';
import { EditUserDialog } from './edit-municipality-user-dialog';
import { DeleteUserDialog } from './delete-municipality-user-dialog';
import { deleteMunicipalityUser } from '@/api/endpoints/municipality-users';
interface MunicipalityUsersTableProps {
  users: User[];
  roles: Role[];
  refetch: () => void;
}

export function MunicipalityUsersTable({ users, roles, refetch }: MunicipalityUsersTableProps) {
  const columns = React.useMemo(
    () => [
      { accessorKey: 'username', header: 'Username' },
      { accessorKey: 'email', header: 'Email' },
      { accessorKey: 'firstName', header: 'First Name' },
      { accessorKey: 'lastName', header: 'Last Name' },
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

          
          const handleConfirmDelete = async () => {
            try {
              await deleteMunicipalityUser(user.id); 
              console.log('Deleted user', user.id);
              refetch(); 
            } catch (err) {
              console.error('Error deleting user:', err);
            }
          };

          return (
            <div className="flex items-center gap-2">
              
              <EditUserDialog user={user} roles={roles} onSuccess={refetch} />

              <DeleteUserDialog user={user} onConfirm={handleConfirmDelete} />
            </div>
          );
        },
      },
    ],
    [roles, refetch],
  );

  return (
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
  );
}


