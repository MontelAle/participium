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

export type ReportsTableProps = {
  data: Report[];
  onViewReport: (report: Report) => void;
};

export function ReportsTable({ data, onViewReport }: ReportsTableProps) {
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
          // Badge colorato in base allo status
          let bgColor = 'bg-gray-100 text-gray-700';
          if (status === 'pending') bgColor = 'bg-yellow-100 text-yellow-800';
          else if (status === 'in_progress') bgColor = 'bg-blue-100 text-blue-800';
          else if (status === 'closed') bgColor = 'bg-green-100 text-green-800';

          return (
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${bgColor}`}>
              {status.replace('_', ' ')}
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
            <Button onClick={() => onViewReport(report)}>
              View Report Details
            </Button>
          );
        },
      },
    ],
    [onViewReport]
  );

  return (
    <TableProvider columns={columns as any} data={data}>
      <TableHeader>
        {({ headerGroup }) => (
          <TableHeaderGroup headerGroup={headerGroup}>
            {({ header }) => (
              <TableColumnHeader
                column={header.column as any}
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
