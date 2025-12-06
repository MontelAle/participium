import {
  type Cell,
  type Column,
  type ColumnDef,
  type Header,
  type HeaderGroup,
  type Row,
  type SortingState,
  type Table,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { atom, useAtom } from 'jotai';
import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon } from 'lucide-react';
import React, {
  type HTMLAttributes,
  type ReactNode,
  createContext,
  memo,
  useCallback,
  useContext,
  useMemo,
} from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  TableBody as TableBodyRaw,
  TableCell as TableCellRaw,
  TableHead as TableHeadRaw,
  TableHeader as TableHeaderRaw,
  Table as TableRaw,
  TableRow as TableRowRaw,
} from '@/components/ui/table';

export type { ColumnDef } from '@tanstack/react-table';

const sortingAtom = atom<SortingState>([]);

interface TableContextValue {
  data: unknown[];
  columns: ColumnDef<unknown, unknown>[];
  table: Table<unknown> | null;
}

export const TableContext = createContext<TableContextValue>({
  data: [],
  columns: [],
  table: null,
});

export type TableProviderProps<TData, TValue> = Readonly<{
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  children: ReactNode;
  className?: string;
}>;

export function TableProvider<TData, TValue>({
  columns,
  data,
  children,
  className,
}: TableProviderProps<TData, TValue>) {
  const [sorting, setSorting] = useAtom(sortingAtom);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: (updater) => {
      // @ts-expect-error updater is a function that returns a sorting object handled by TanStack
      const newSorting = updater(sorting);
      setSorting(newSorting);
    },
    state: {
      sorting,
    },
  });

  const contextValue = useMemo(
    () => ({
      data,
      columns: columns as never,
      table: table as never,
    }),
    [data, columns, table],
  );

  return (
    <TableContext.Provider value={contextValue}>
      <TableRaw className={className}>{children}</TableRaw>
    </TableContext.Provider>
  );
}

export type TableHeadProps = Readonly<{
  header: Header<unknown, unknown>;
  className?: string;
}>;

export const TableHead = memo(({ header, className }: TableHeadProps) => (
  <TableHeadRaw className={className} key={header.id}>
    {header.isPlaceholder
      ? null
      : flexRender(header.column.columnDef.header, header.getContext())}
  </TableHeadRaw>
));

TableHead.displayName = 'TableHead';

export type TableHeaderGroupProps = Readonly<{
  headerGroup: HeaderGroup<unknown>;
  children: (props: { header: Header<unknown, unknown> }) => ReactNode;
  className?: string;
}>;

export const TableHeaderGroup = ({
  headerGroup,
  children,
  className,
}: TableHeaderGroupProps) => (
  <TableRowRaw key={headerGroup.id} className={className}>
    {headerGroup.headers.map((header) => (
      <React.Fragment key={header.id}>{children({ header })}</React.Fragment>
    ))}
  </TableRowRaw>
);

export type TableHeaderProps = Readonly<{
  className?: string;
  children: (props: { headerGroup: HeaderGroup<unknown> }) => ReactNode;
}>;

export const TableHeader = ({ className, children }: TableHeaderProps) => {
  const { table } = useContext(TableContext);

  return (
    <TableHeaderRaw className={className}>
      {table?.getHeaderGroups().map((headerGroup) => (
        <React.Fragment key={headerGroup.id}>
          {children({ headerGroup })}
        </React.Fragment>
      ))}
    </TableHeaderRaw>
  );
};

export interface TableColumnHeaderProps<TData, TValue>
  extends Readonly<HTMLAttributes<HTMLDivElement>> {
  column: Column<TData, TValue>;
  title: string;
}

export function TableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: TableColumnHeaderProps<TData, TValue>) {
  const handleSortAsc = useCallback(() => {
    column.toggleSorting(false);
  }, [column]);

  const handleSortDesc = useCallback(() => {
    column.toggleSorting(true);
  }, [column]);

  if (!column.getCanSort()) {
    return <TableHeadRaw className={className}>{title}</TableHeadRaw>;
  }

  const SortIcon = () => {
    const sortState = column.getIsSorted();
    if (sortState === 'desc') return <ArrowDownIcon className="ml-2 h-4 w-4" />;
    if (sortState === 'asc') return <ArrowUpIcon className="ml-2 h-4 w-4" />;
    return <ChevronsUpDownIcon className="ml-2 h-4 w-4" />;
  };

  return (
    <TableHeadRaw className={className}>
      <div className="flex items-center space-x-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="-ml-3 h-8 data-[state=open]:bg-accent"
              size="sm"
              variant="ghost"
            >
              <span>{title}</span>
              <SortIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={handleSortAsc}>
              <ArrowUpIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
              Asc
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSortDesc}>
              <ArrowDownIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
              Desc
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </TableHeadRaw>
  );
}

export type TableCellProps = Readonly<{
  cell: Cell<unknown, unknown>;
  className?: string;
}>;

export const TableCell = ({ cell, className }: TableCellProps) => (
  <TableCellRaw className={className}>
    {flexRender(cell.column.columnDef.cell, cell.getContext())}
  </TableCellRaw>
);

export type TableRowProps = Readonly<{
  row: Row<unknown>;
  children: (props: { cell: Cell<unknown, unknown> }) => ReactNode;
  className?: string;
}>;

export const TableRow = ({ row, children, className }: TableRowProps) => (
  <TableRowRaw
    className={className}
    data-state={row.getIsSelected() && 'selected'}
  >
    {row.getVisibleCells().map((cell) => (
      <React.Fragment key={cell.id}>{children({ cell })}</React.Fragment>
    ))}
  </TableRowRaw>
);

export type TableBodyProps = Readonly<{
  children: (props: { row: Row<unknown> }) => ReactNode;
  className?: string;
}>;

export const TableBody = ({ children, className }: TableBodyProps) => {
  const { columns, table } = useContext(TableContext);
  const rows = table?.getRowModel().rows;

  return (
    <TableBodyRaw className={className}>
      {rows?.length ? (
        rows.map((row) => (
          <React.Fragment key={row.id}>{children({ row })}</React.Fragment>
        ))
      ) : (
        <TableRowRaw>
          <TableCellRaw className="h-24 text-center" colSpan={columns.length}>
            No Data found.
          </TableCellRaw>
        </TableRowRaw>
      )}
    </TableBodyRaw>
  );
};
