import {
  TableBody as TableBodyRaw,
  TableCell as TableCellRaw,
  TableHead as TableHeadRaw,
  TableHeader as TableHeaderRaw,
  Table as TableRaw,
  TableRow as TableRowRaw,
} from '@/components/ui/table';
import {
  type Cell,
  type ColumnDef,
  type Header,
  type HeaderGroup,
  type Row,
  type Table,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Fragment,
  type ReactNode,
  createContext,
  memo,
  useContext,
  useMemo,
} from 'react';

export type { ColumnDef } from '@tanstack/react-table';

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
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
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
      <Fragment key={header.id}>{children({ header })}</Fragment>
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
        <Fragment key={headerGroup.id}>{children({ headerGroup })}</Fragment>
      ))}
    </TableHeaderRaw>
  );
};

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
      <Fragment key={cell.id}>{children({ cell })}</Fragment>
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
        rows.map((row) => <Fragment key={row.id}>{children({ row })}</Fragment>)
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
