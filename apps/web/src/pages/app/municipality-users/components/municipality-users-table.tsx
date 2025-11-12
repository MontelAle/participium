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
import { EditMunicipalityUserDialog } from './edit-municipality-user-dialog';
import { DeleteMunicipalityUserDialog } from './delete-municipality-user-dialog';
import { useMunicipalityUsers } from '@/hooks/use-municipality-users';

export function MunicipalityUsersTable() {
  const { data: municipalUsers = [] } = useMunicipalityUsers();
  const prettifyRole = (name: string) =>
    name
      .replace(/_/g, ' ')
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');

  const columns = React.useMemo(
    () => [
      { accessorKey: 'username', header: 'Username' },
      { accessorKey: 'email', header: 'Email' },
      { accessorKey: 'firstName', header: 'First Name' },
      { accessorKey: 'lastName', header: 'Last Name' },
      {
        accessorKey: 'role',
        header: 'Role',
        cell: ({ getValue }: any) => {
          const v = getValue();
          const name =
            typeof v === 'object' ? (v?.name ?? '') : String(v ?? '');
          return (
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
              {prettifyRole(name)}
            </span>
          );
        },
      },
      {
        id: 'operations',
        header: 'Operations',
        cell: ({ row }: any) => {
          const user = row.original as User;

          return (
            <div className="flex items-center gap-2">
              <EditMunicipalityUserDialog user={user} />

              <DeleteMunicipalityUserDialog user={user} />
            </div>
          );
        },
      },
    ],
    [municipalUsers],
  );

  return (
    <TableProvider columns={columns} data={municipalUsers}>
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
