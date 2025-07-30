"use client";

import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridRowModel,
} from "@mui/x-data-grid";
import { useDataStore } from "@/store/useDataStore";
import type { Client, Worker, Task } from "@/types";

interface DataGridViewProps {
  rows: any[];
  title: "clients" | "workers" | "tasks";
}

export default function DataGridView({ rows, title }: DataGridViewProps) {
  const validations = useDataStore((s) => s.validations[title]);
  const setRowAndValidate = useDataStore((s) => s.setRowAndValidate);

  if (rows.length === 0) return null;

  const rowsWithId = rows.map((row, index) => ({
    ...row,
    id: index,
  }));

  const handleRowUpdate = (updatedRow: GridRowModel) => {
    const rowIndex = Number(updatedRow.id);

    if (title === "clients") {
      const typedRow = { ...(updatedRow as Client), id: rowIndex };
      setRowAndValidate("clients", rowIndex, typedRow);
      return typedRow;
    } else if (title === "workers") {
      const typedRow = { ...(updatedRow as Worker), id: rowIndex };
      setRowAndValidate("workers", rowIndex, typedRow);
      return typedRow;
    } else {
      const typedRow = { ...(updatedRow as Task), id: rowIndex };
      setRowAndValidate("tasks", rowIndex, typedRow);
      return typedRow;
    }
  };

  const columns: GridColDef[] = Object.keys(rows[0]).map((key) => ({
    field: key,
    headerName: key,
    width: 180,
    editable: true,
    cellClassName: (params) => {
      const rowId = Number(params.id);
      const errorRow = validations.find((v) => v.rowIndex === rowId);
      return errorRow?.errors[params.field] ? "cell-error" : "";
    },
    renderCell: (params: GridRenderCellParams) => {
      const rowId = Number(params.id);
      const errorRow = validations.find((v) => v.rowIndex === rowId);
      const errorMessage = errorRow?.errors[params.field];

      return (
        <div
          title={errorMessage || ""}
          className="truncate max-w-full overflow-hidden text-ellipsis"
        >
          {params.value}
        </div>
      );
    },
  }));

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold capitalize text-gray-800">
          {title}
        </h2>
        {validations.length > 0 && (
          <span className="text-sm text-red-700 bg-red-100 px-3 py-1 rounded-full">
            {validations.length} row(s) with issues
          </span>
        )}
      </div>

      {title === "tasks" &&
        validations.some((v) => v.errors._rowLevel) && (
          <div className="text-sm text-red-700 bg-red-100 px-4 py-2 rounded mb-3">
            Tasks cannot be performed by any worker due to unmatched RequiredSkills.
          </div>
        )}

      <div className="rounded-lg shadow border border-gray-200 bg-white overflow-hidden">
        <div style={{ height: 400, width: "100%" }}>
          <DataGrid
            rows={rowsWithId}
            columns={columns}
            processRowUpdate={handleRowUpdate}
            onProcessRowUpdateError={(err) => console.error(err)}
            disableRowSelectionOnClick
            getRowClassName={(params) => {
              const errorRow = validations.find(
                (v) => v.rowIndex === Number(params.id)
              );
              return errorRow?.errors._rowLevel ? "row-error" : "";
            }}
            sx={{
              "& .cell-error": {
                backgroundColor: "#fee2e2 !important",
                color: "#b91c1c",
                fontWeight: 500,
              },
              "& .row-error": {
                backgroundColor: "#fef2f2 !important",
                borderLeft: "4px solid #dc2626",
              },
              "& .MuiDataGrid-columnHeaders": {
                backgroundColor: "#f9fafb",
                fontWeight: "bold",
                fontSize: "0.95rem",
              },
              "& .MuiDataGrid-cell": {
                fontSize: "0.95rem",
              },
              "& .MuiDataGrid-row:hover": {
                backgroundColor: "#f3f4f6",
              },
            }}
            pageSizeOptions={[10, 20, 50, 100]}
          />
        </div>
      </div>
    </div>
  );
}
