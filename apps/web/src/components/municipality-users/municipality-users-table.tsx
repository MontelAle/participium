import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  TableBody,
  TableCell,
  TableColumnHeader,
  TableHeader,
  TableHeaderGroup,
  TableProvider,
  TableRow,
} from '@/components/ui/shadcn-io/table';
import { cn, prettifyRole } from '@/lib/utils';
import type { Office, Role, User } from '@/types';
import { MunicipalityUsersTableProps } from '@/types/ui';
import type { ColumnDef } from '@tanstack/react-table'; // Aggiungi ColumnDef
import { Pencil, Search } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DeleteMunicipalityUserDialog } from './delete-municipality-user-dialog';

const UserInfoCell = ({ user }: { user: User }) => {
  const initials =
    (
      (user.firstName?.charAt(0) || '') + (user.lastName?.charAt(0) || '')
    ).toUpperCase() || 'U';

  return (
    <div className="flex items-center gap-3 py-1 min-w-[200px]">
      <Avatar className="h-10 w-10 border-2 border-background shadow-sm shrink-0">
        <AvatarImage src="" />
        <AvatarFallback className="bg-primary/10 text-primary font-bold">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col min-w-0">
        <span className="font-semibold text-base text-foreground truncate">
          {user.username}
        </span>
        <span className="text-sm text-muted-foreground truncate">
          {user.email}
        </span>
      </div>
    </div>
  );
};

const RoleCell = ({ role }: { role: Role | undefined }) => {
  const name = role?.name || '';
  const isSuperAdmin = name === 'super_admin';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2.5 py-0.5 text-sm font-medium border whitespace-nowrap',
        isSuperAdmin
          ? 'bg-purple-50 text-purple-700 border-purple-200'
          : 'bg-slate-100 text-slate-700 border-slate-200',
      )}
    >
      {prettifyRole(name)}
    </span>
  );
};

const OfficeCell = ({ office }: { office: Office | undefined }) => {
  const label = office?.label || '-';
  return (
    <span className="inline-flex items-center rounded-md px-2.5 py-0.5 text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
      {label}
    </span>
  );
};

const OperationsCell = ({ user }: { user: User }) => {
  const navigate = useNavigate();

  return (
    <div className="text-base items-center">
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 text-muted-foreground"
        onClick={() => navigate(`/app/municipality-users/view/${user.id}`)}
        aria-label="Edit"
      >
        <Pencil className="h-5 w-5" />
      </Button>
      <DeleteMunicipalityUserDialog user={user} />
    </div>
  );
};

export function MunicipalityUsersTable({ data }: MunicipalityUsersTableProps) {
  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        accessorKey: 'username',
        header: 'User',
        size: 250,
        cell: ({ row }) => <UserInfoCell user={row.original} />,
      },
      {
        accessorKey: 'firstName',
        header: 'Full Name',
        cell: ({ row }) => (
          <span className="text-base whitespace-nowrap">
            {row.original.firstName} {row.original.lastName}
          </span>
        ),
      },
      {
        accessorKey: 'role',
        header: 'Role',
        cell: ({ row }) => <RoleCell role={row.original.role} />,
      },
      {
        accessorKey: 'office',
        header: 'Office',
        cell: ({ row }) => <OfficeCell office={row.original.office} />,
      },
      {
        id: 'operations',
        header: 'Operations',
        cell: ({ row }) => <OperationsCell user={row.original} />,
      },
    ],
    [], // Dipendenze vuote! Molto più efficiente.
  );

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border-t">
        <div className="rounded-full bg-muted/50 p-4 mb-3">
          <Search className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <h3 className="text-lg font-semibold">No users found</h3>
        <p className="text-muted-foreground">
          Try adjusting your filters or search query
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-auto rounded-md border">
      <div className="min-w-[800px]">
        <TableProvider columns={columns} data={data}>
          <TableHeader>
            {({ headerGroup }) => (
              <TableHeaderGroup
                headerGroup={headerGroup}
                className="bg-muted/40 hover:bg-muted/40 border-b"
              >
                {({ header }) => (
                  <TableColumnHeader
                    column={header.column}
                    title={
                      typeof header.column.columnDef.header === 'function'
                        ? header.column.columnDef.header(header.getContext())
                        : header.column.columnDef.header
                    }
                    className="h-12 text-sm font-semibold text-muted-foreground px-4 first:pl-6"
                  />
                )}
              </TableHeaderGroup>
            )}
          </TableHeader>
          <TableBody>
            {({ row }) => (
              <TableRow
                row={row}
                className="border-b transition-colors hover:bg-muted/30 data-[state=selected]:bg-muted"
              >
                {({ cell }) => (
                  <TableCell
                    cell={cell}
                    className="p-4 first:pl-6 align-middle"
                  />
                )}
              </TableRow>
            )}
          </TableBody>
        </TableProvider>
      </div>
    </div>
  );
}
