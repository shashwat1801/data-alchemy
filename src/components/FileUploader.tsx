"use client";

import { ChangeEvent, useState } from "react";
import * as XLSX from "xlsx";
import Papa from "papaparse";

interface FileUploaderProps {
  label: string;
  onDataParsed: (data: any[], fileType: string) => void;
  onRemove?: () => void;
}

export default function FileUploader({ label, onDataParsed, onRemove }: FileUploaderProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);
    setFileName(null);

    if (!file) return;

    const labelKey = label.toLowerCase();
    const fileType = file.name.endsWith(".xlsx") ? "xlsx" : file.name.endsWith(".csv") ? "csv" : null;

    if (!fileType) {
      setError("Unsupported file type. Please upload a CSV or XLSX file.");
      return;
    }

    setLoading(true);
    setFileName(file.name);

    const reader = new FileReader();

    reader.onload = () => {
      try {
        if (fileType === "xlsx") {
          const workbook = XLSX.read(reader.result, { type: "array" });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: "" });
          const withId = jsonData.map((row, i) =>
            typeof row === "object" && row !== null
              ? { id: i, ...row }
              : { id: i, value: row }
          );
          onDataParsed(withId, labelKey);
        } else {
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              const parsed = results.data as any[];
              const withId = parsed.map((row, i) => ({ id: i, ...row }));
              onDataParsed(withId, labelKey);
            },
            error: () => {
              setError("Failed to parse CSV file.");
            },
          });
        }
      } catch (err) {
        setError("Failed to read the file.");
      } finally {
        setLoading(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="flex flex-col w-full space-y-1">
      <label className="text-sm font-semibold text-gray-700">{label}</label>

      <input
        type="file"
        accept=".csv,.xlsx"
        onChange={handleFileUpload}
        className="text-sm text-gray-700 file:mr-4 file:py-1.5 file:px-4 file:rounded file:border-0 file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer"
      />

      {loading && (
        <div className="flex items-center space-x-2 text-sm text-blue-600 mt-1">
          <span className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>Processing file...</span>
        </div>
      )}

      {fileName && !loading && !error && (
        <div className="text-xs text-green-700 mt-1">
          Processed - {fileName} loaded successfully
        </div>
      )}

      {error && (
        <div className="text-xs text-red-600 mt-1"> {error}</div>
      )}
      {onRemove && (
        <button
          onClick={onRemove}
          className=" mt-1 text-sm text-red-600 underline hover:text-red-800"
        >
          Remove file
        </button>
      )}
    </div>
  );
}