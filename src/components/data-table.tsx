"use client";

import * as React from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type FilterFn,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  IconAdjustmentsHorizontal,
  IconArrowDown,
  IconArrowUp,
  IconArrowsSort,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconFilter,
  IconRotate,
  IconSearch,
  IconX,
} from "@tabler/icons-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type FilterOption = { label: string; value: string };

export type FacetedFilterConfig = {
  columnId: string;
  title: string;
  options: FilterOption[];
};

export type DateFilterConfig = {
  columnId: string;
  label: string;
};

export type NumberFilterConfig = {
  columnId: string;
  label: string;
  min: number;
  max: number;
  step?: number;
  format?: (value: number) => string;
};

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  toolbar?: React.ReactNode;
  facetedFilters?: FacetedFilterConfig[];
  dateFilters?: DateFilterConfig[];
  numberFilters?: NumberFilterConfig[];
  /** Persist filters/sorting/pagination in the URL (shareable views). */
  syncUrl?: boolean;
  /** Content rendered inside a right-click context menu on each row. */
  rowContextMenu?: (row: TData) => React.ReactNode;
  emptyState?: React.ReactNode;
}

// --- custom filter functions -------------------------------------------------

/** One filter fn that handles text, faceted (array), date-range and number-range values. */
const autoFilter: FilterFn<unknown> = (row, columnId, filterValue) => {
  if (filterValue === undefined || filterValue === null || filterValue === "") return true;
  const rowValue = row.getValue(columnId);

  if (Array.isArray(filterValue)) {
    if (
      filterValue.length === 2 &&
      filterValue.every((item) => typeof item === "number")
    ) {
      const number = Number(rowValue);
      return number >= filterValue[0] && number <= filterValue[1];
    }
    return filterValue.some((item) => String(item) === String(rowValue));
  }

  if (
    typeof filterValue === "object" &&
    ("from" in filterValue || "to" in filterValue)
  ) {
    const range = filterValue as { from?: string; to?: string };
    if (!range.from && !range.to) return true;
    if (!rowValue) return false;
    const time = new Date(String(rowValue)).getTime();
    if (Number.isNaN(time)) return false;
    if (range.from && time < new Date(`${range.from}T00:00:00`).getTime()) return false;
    if (range.to && time > new Date(`${range.to}T23:59:59`).getTime()) return false;
    return true;
  }

  return String(rowValue ?? "")
    .toLowerCase()
    .includes(String(filterValue).toLowerCase());
};

// --- filter controls ---------------------------------------------------------

function FacetedFilter({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: FilterOption[];
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const [query, setQuery] = React.useState("");
  const visible = options.filter((option) =>
    option.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 border-dashed">
          <IconFilter className="size-4" />
          {title}
          {value.length ? (
            <>
              <span className="mx-0.5 h-4 w-px bg-border" />
              <span className="rounded bg-primary/10 px-1.5 text-xs font-medium text-primary tabular-nums">
                {value.length}
              </span>
            </>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-52 p-1">
        <div className="relative p-1">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Search ${title.toLowerCase()}…`}
            className="h-8 pl-8"
          />
        </div>
        <div className="max-h-56 overflow-y-auto">
          {visible.length ? (
            visible.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
              >
                <Checkbox
                  checked={value.includes(option.value)}
                  onCheckedChange={(checked) =>
                    onChange(
                      checked
                        ? [...value, option.value]
                        : value.filter((v) => v !== option.value)
                    )
                  }
                />
                <span className="truncate">{option.label}</span>
              </label>
            ))
          ) : (
            <p className="px-2 py-4 text-center text-xs text-muted-foreground">
              No matches.
            </p>
          )}
        </div>
        {value.length ? (
          <button
            type="button"
            onClick={() => onChange([])}
            className="mt-1 flex w-full items-center gap-2 rounded-md border-t px-2 py-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <IconX className="size-3.5" /> Clear filter
          </button>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

function DateFilter({
  label,
  value,
  onChange,
}: {
  label: string;
  value: { from?: string; to?: string };
  onChange: (value: { from?: string; to?: string }) => void;
}) {
  const active = Boolean(value.from || value.to);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={cn("h-9", active && "border-primary/50")}>
          {label}
          {active ? <span className="size-1.5 rounded-full bg-primary" /> : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 space-y-3">
        <p className="text-sm font-medium">{label}</p>
        <div className="space-y-2">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">From</span>
            <Input
              type="date"
              value={value.from ?? ""}
              onChange={(event) => onChange({ ...value, from: event.target.value || undefined })}
            />
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">To</span>
            <Input
              type="date"
              value={value.to ?? ""}
              onChange={(event) => onChange({ ...value, to: event.target.value || undefined })}
            />
          </div>
        </div>
        {active ? (
          <Button variant="ghost" size="sm" className="w-full" onClick={() => onChange({})}>
            Clear dates
          </Button>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

function NumberFilter({
  config,
  value,
  onChange,
}: {
  config: NumberFilterConfig;
  value: [number, number];
  onChange: (value: [number, number]) => void;
}) {
  const format = config.format ?? ((n: number) => String(n));
  const active = value[0] !== config.min || value[1] !== config.max;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={cn("h-9", active && "border-primary/50")}>
          {config.label}
          {active ? <span className="size-1.5 rounded-full bg-primary" /> : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">{config.label}</p>
          <p className="text-xs text-muted-foreground tabular-nums">
            {format(value[0])} – {format(value[1])}
          </p>
        </div>
        <Slider
          min={config.min}
          max={config.max}
          step={config.step ?? 1}
          value={value}
          onValueChange={(next) => onChange(next as [number, number])}
        />
        {active ? (
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => onChange([config.min, config.max])}
          >
            Clear range
          </Button>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

// --- table ------------------------------------------------------------------

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Search…",
  toolbar,
  facetedFilters = [],
  dateFilters = [],
  numberFilters = [],
  syncUrl = true,
  rowContextMenu,
  emptyState,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 8 });
  const [urlReady, setUrlReady] = React.useState(!syncUrl);

  // Restore a shareable view from the URL once on mount.
  React.useEffect(() => {
    if (!syncUrl) return;
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.has("q") && searchKey) {
        setColumnFilters((current) => [
          ...current.filter((f) => f.id !== searchKey),
          { id: searchKey, value: params.get("q") },
        ]);
      }
      if (params.has("sort")) {
        const [id, direction] = params.get("sort")!.split(":");
        if (id) setSorting([{ id, desc: direction === "desc" }]);
      }
      if (params.has("filters")) {
        const parsed = JSON.parse(params.get("filters")!) as ColumnFiltersState;
        if (Array.isArray(parsed)) setColumnFilters((current) => [...current, ...parsed]);
      }
      if (params.has("cols")) {
        setColumnVisibility(JSON.parse(params.get("cols")!) as VisibilityState);
      }
      if (params.has("page")) {
        setPagination((current) => ({ ...current, pageIndex: Number(params.get("page")) || 0 }));
      }
      if (params.has("size")) {
        setPagination((current) => ({ ...current, pageSize: Number(params.get("size")) || 8 }));
      }
    } catch {
      // A malformed URL should never break the table.
    }
    setUrlReady(true);
  }, [syncUrl, searchKey]);

  // Write the current view back to the URL without re-navigating.
  React.useEffect(() => {
    if (!syncUrl || !urlReady || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const searchValue = searchKey
      ? (columnFilters.find((f) => f.id === searchKey)?.value as string) ?? ""
      : "";
    const otherFilters = columnFilters.filter((f) => f.id !== searchKey);
    const set = (key: string, value: string | null) => {
      if (value) params.set(key, value);
      else params.delete(key);
    };
    set("q", searchValue || null);
    set(
      "sort",
      sorting.length ? `${sorting[0].id}:${sorting[0].desc ? "desc" : "asc"}` : null
    );
    set("filters", otherFilters.length ? JSON.stringify(otherFilters) : null);
    set("cols", Object.keys(columnVisibility).length ? JSON.stringify(columnVisibility) : null);
    set("page", pagination.pageIndex ? String(pagination.pageIndex) : null);
    set("size", pagination.pageSize !== 8 ? String(pagination.pageSize) : null);
    const search = params.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${search ? `?${search}` : ""}`
    );
  }, [syncUrl, urlReady, searchKey, columnFilters, sorting, columnVisibility, pagination]);

  const table = useReactTable({
    data,
    columns,
    defaultColumn: { filterFn: autoFilter as FilterFn<TData> },
    state: { sorting, columnFilters, columnVisibility, rowSelection, pagination },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  function setFilter(id: string, value: unknown) {
    setColumnFilters((current) => [
      ...current.filter((filter) => filter.id !== id),
      { id, value },
    ]);
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  }

  function resetFilters() {
    setColumnFilters([]);
    setSorting([]);
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  }

  const selectedCount = table.getFilteredSelectedRowModel().rows.length;
  const totalCount = table.getFilteredRowModel().rows.length;
  const hasFilters = columnFilters.length > 0 || sorting.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        {searchKey ? (
          <div className="relative w-full sm:max-w-xs">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
              onChange={(event) => setFilter(searchKey, event.target.value)}
              placeholder={searchPlaceholder}
              className="pl-9"
              aria-label={searchPlaceholder}
            />
          </div>
        ) : null}
        <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
          {facetedFilters.map((config) => (
            <FacetedFilter
              key={config.columnId}
              title={config.title}
              options={config.options}
              value={
                (table.getColumn(config.columnId)?.getFilterValue() as string[]) ?? []
              }
              onChange={(value) => setFilter(config.columnId, value)}
            />
          ))}
          {dateFilters.map((config) => (
            <DateFilter
              key={config.columnId}
              label={config.label}
              value={
                (table.getColumn(config.columnId)?.getFilterValue() as {
                  from?: string;
                  to?: string;
                }) ?? {}
              }
              onChange={(value) => setFilter(config.columnId, value)}
            />
          ))}
          {numberFilters.map((config) => (
            <NumberFilter
              key={config.columnId}
              config={config}
              value={
                (table.getColumn(config.columnId)?.getFilterValue() as [number, number]) ??
                [config.min, config.max]
              }
              onChange={(value) => setFilter(config.columnId, value)}
            />
          ))}
          {hasFilters ? (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              <IconRotate className="size-4" /> Reset
            </Button>
          ) : null}
          {toolbar}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconAdjustmentsHorizontal className="size-4" />
                View
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table className="min-w-[800px]">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/40">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => {
                const body = (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                );
                return rowContextMenu ? (
                  <ContextMenu key={row.id}>
                    <ContextMenuTrigger asChild>{body}</ContextMenuTrigger>
                    <ContextMenuContent>{rowContextMenu(row.original)}</ContextMenuContent>
                  </ContextMenu>
                ) : (
                  body
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="p-0">
                  {emptyState ?? (
                    <Empty className="rounded-none border-0 py-14">
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <IconSearch />
                        </EmptyMedia>
                        <EmptyTitle>No results found</EmptyTitle>
                        <EmptyDescription>
                          Try a different search or clear your filters.
                        </EmptyDescription>
                      </EmptyHeader>
                      {hasFilters ? (
                        <EmptyContent>
                          <Button variant="outline" size="sm" onClick={resetFilters}>
                            Clear filters
                          </Button>
                        </EmptyContent>
                      ) : null}
                    </Empty>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {selectedCount > 0
            ? `${selectedCount} of ${totalCount} row(s) selected`
            : `${totalCount} row(s)`}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 sm:justify-end">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Rows per page</span>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger size="sm" className="w-[72px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[8, 10, 20, 50].map((size) => (
                  <SelectItem key={size} value={`${size}`}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <span className="text-sm text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="size-8" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
              <IconChevronsLeft className="size-4" />
            </Button>
            <Button variant="outline" size="icon" className="size-8" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
              <IconChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" size="icon" className="size-8" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              <IconChevronRight className="size-4" />
            </Button>
            <Button variant="outline" size="icon" className="size-8" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>
              <IconChevronsRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Sortable column header button — use in a column's `header`. */
export function SortableHeader({
  column,
  title,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  column: any;
  title: string;
}) {
  const sorted = column.getIsSorted();
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 data-[state=open]:bg-accent"
      onClick={() => column.toggleSorting(sorted === "asc")}
    >
      {title}
      {sorted === "asc" ? (
        <IconArrowUp className="size-3.5" />
      ) : sorted === "desc" ? (
        <IconArrowDown className="size-3.5" />
      ) : (
        <IconArrowsSort className="size-3.5 text-muted-foreground" />
      )}
    </Button>
  );
}
