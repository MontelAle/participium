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
import type { Report } from '@repo/api';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export type ReportsTableProps = {
  data: Report[];
};

export function ReportsTable({ data }: ReportsTableProps) {
  const navigate = useNavigate();

  const columns = React.useMemo(
    () => [
      {
        accessorKey: 'title',
        header: 'Title',
      },
      {
        accessorKey: 'category',
        header: 'Category',
        cell: ({ getValue }: any) => {
          const category = getValue();
          return typeof category === 'object' && category !== null
            ? category.name
            : String(category ?? '');
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }: any) => {
          const status = getValue();
          let bgColor = 'bg-gray-100 text-gray-700';
          if (status === 'pending') bgColor = 'bg-yellow-100 text-yellow-800';
          else if (status === 'in_progress')
            bgColor = 'bg-blue-100 text-blue-800';
          else if (status === 'closed' || status === 'resolved')
            bgColor = 'bg-green-100 text-green-800';
          else if (status === 'rejected') bgColor = 'bg-red-100 text-red-800';
          else if (status === 'assigned')
            bgColor = 'bg-purple-100 text-purple-800';

          return (
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${bgColor}`}
            >
              {status.replaceAll('_', ' ')}
            </span>
          );
        },
      },
      {
        id: 'operations',
        header: 'Operations',
        cell: ({ row }: any) => {
          const report = row.original as Report;
          return (
            <Button
              onClick={() => navigate(`/app/assign-reports/view/${report.id}`)}
            >
              View Report Details
            </Button>
          );
        },
      },
    ],
    [],
  );

  return (
    <>
      <TableProvider columns={columns as any} data={data}>
        <TableHeader>
          {({ headerGroup }) => (
            <TableHeaderGroup headerGroup={headerGroup}>
              {({ header }) => (
                <TableColumnHeader
                  key={header.id}
                  column={header.column as any}
                  title={header.column.columnDef.header as string}
                />
              )}
            </TableHeaderGroup>
          )}
        </TableHeader>

        <TableBody>
          {({ row }) => (
            <TableRow key={row.id} row={row}>
              {({ cell }) => <TableCell key={cell.id} cell={cell} />}
            </TableRow>
          )}
        </TableBody>
      </TableProvider>
    </>
  );
}
