import * as XLSX from "xlsx";

export function parseXlsx(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const workbook = XLSX.read(reader.result, { type: "binary" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        resolve(data as any[]);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (err) => reject(err);
     reader.readAsArrayBuffer(file);
  });
}
