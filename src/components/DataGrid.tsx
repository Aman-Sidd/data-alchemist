"use client";

import React from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
  Row,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type CellError = {
  rowIndex: number;
  columnId: string;
  message: string;
};

type DataGridProps = {
  data: any[];
  columns: ColumnDef<any, any>[];
  onCellEdit: (rowIndex: number, columnId: string, newValue: any) => void;
  cellErrors?: CellError[]; // [{ rowIndex, columnId, message }]
};

const DataGrid: React.FC<DataGridProps> = ({
  data,
  columns,
  onCellEdit,
  cellErrors = [],
}) => {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // Helper to check if a cell is invalid
  const isCellInvalid = (rowIdx: number, colId: string) =>
    cellErrors.some(
      (err) => err.rowIndex === rowIdx && err.columnId === colId
    );
const arrayFields = ["AvailableSlots", "PreferredPhases"];

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="min-w-full text-sm">
        <thead className="bg-muted">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-4 py-2 font-semibold text-left border-b"
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row: Row<any>, rowIdx) => (
            <tr key={row.id} className="transition-colors hover:bg-muted">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-2 border-b">
                  <Input
  className={cn(
    "w-full bg-transparent",
    isCellInvalid(rowIdx, cell.column.id) && "border-destructive focus-visible:ring-destructive"
  )}
  value={
    arrayFields.includes(cell.column.id) && Array.isArray(cell.getValue())
      ? JSON.stringify(cell.getValue())
      : cell.getValue() !== undefined && cell.getValue() !== null
      ? String(cell.getValue())
      : ""
  }
  onChange={(e) => {
    let newValue: any = e.target.value;
    if (arrayFields.includes(cell.column.id)) {
      try {
        newValue = JSON.parse(e.target.value);
      } catch {
        // keep as string if not valid JSON
      }
    }
    onCellEdit(rowIdx, cell.column.id, newValue);
  }}
/>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataGrid;