import Papa from "papaparse";
import * as XLSX from "xlsx";

// Define expected headers for each entity
const ENTITY_HEADERS: Record<
  "clients" | "workers" | "tasks",
  string[]
> = {
  clients: ["ClientID", "ClientName", "Email", "Phone"],
  workers: ["WorkerID", "WorkerName", "Skill", "Email"],
  tasks: ["TaskID", "TaskName", "AssignedTo", "DueDate"],
};

// Normalize header: remove spaces, make PascalCase
function normalizeHeader(header: string): string {
  return header.replace(/\s+/g, "").replace(/Id$/, "ID");
}

// Map headers to normalized form
function mapHeaders(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  headers.forEach((h) => {
    mapping[h] = normalizeHeader(h);
  });
  return mapping;
}

export async function parseFile(
  file: File,
  entityType: "clients" | "workers" | "tasks"
): Promise<{
  records: any[];
  missingHeaders: string[];
}> {
  const expectedHeaders = ENTITY_HEADERS[entityType];

  // Helper to process and normalize headers/rows
  const processRows = (rows: any[]): { records: any[]; missingHeaders: string[] } => {
    if (!rows.length) return { records: [], missingHeaders: expectedHeaders };
    const rawHeaders = Object.keys(rows[0]);
    const headerMap = mapHeaders(rawHeaders);

    // Build normalized records
    const records = rows.map((row) => {
      const normalized: any = {};
      for (const key in row) {
        const normKey = normalizeHeader(key);
        normalized[normKey] = row[key];
      }
      return normalized;
    });

    // Find missing headers
    const normalizedHeaders = rawHeaders.map(normalizeHeader);
    const missingHeaders = expectedHeaders.filter(
      (h) => !normalizedHeaders.includes(h)
    );

    return { records, missingHeaders };
  };

  // CSV
  if (file.name.endsWith(".csv")) {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const { records, missingHeaders } = processRows(results.data as any[]);
          resolve({ records, missingHeaders });
        },
        error: (err) => reject(err),
      });
    });
  }

  // XLSX
  if (file.name.endsWith(".xlsx")) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
          const { records, missingHeaders } = processRows(rows);
          resolve({ records, missingHeaders });
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  }

  // Unsupported
  throw new Error("Unsupported file type");
}