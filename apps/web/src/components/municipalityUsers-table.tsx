"use client";

import * as React from "react";
import { TableProvider, TableHeader, TableHeaderGroup, TableRow, TableCell, TableColumnHeader, TableBody } from "@/components/ui/shadcn-io/table";
import { MunicipalityUser } from "@/types/users";



interface MunicipalityUsersTableProps {
  users: MunicipalityUser[];
}

export function MunicipalityUsersTable({ users }: MunicipalityUsersTableProps) {
  const columns = React.useMemo(
    () => [
      {
        accessorKey: "username",
        header: "Username",
      },
      {
        accessorKey: "email",
        header: "Email",
      },
      {
        accessorKey: "firstName",
        header: "First Name",
      },
      {
        accessorKey: "lastName",
        header: "Last Name",
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ getValue }: any) =>
          typeof getValue() === "object" ? getValue().name : getValue(),
      },
    ],
    []
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
