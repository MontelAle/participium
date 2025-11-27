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
import { Eye } from 'lucide-react';

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
              className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-sm font-medium ${bgColor} border whitespace-nowrap`}
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
            <div className="text-base items-center">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground"
                onClick={() =>
                  navigate(`/app/assigned-reports/view/${report.id}`)
                }
                aria-label="View"
              >
                <Eye className="h-5 w-5" />
              </Button>
            </div>
          );
        },
      },
    ],
    [],
  );

  return (
    <div className="relative w-full overflow-auto rounded-md border">
      <div className="min-w-[800px]">
        <TableProvider columns={columns as any} data={data}>
          <TableHeader>
            {({ headerGroup }) => (
              <TableHeaderGroup
                headerGroup={headerGroup}
                className="bg-muted/40 hover:bg-muted/40 border-b"
              >
                {({ header }) => (
                  <TableColumnHeader
                    column={header.column as any}
                    title={
                      typeof header.column.columnDef.header === 'function'
                        ? (header.column.columnDef.header as any)()
                        : (header.column.columnDef.header as string)
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
