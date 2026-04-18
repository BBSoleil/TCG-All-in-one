import type { Result } from "@/shared/types";

export interface CSVImportRow {
  name: string;
  quantity: number;
  condition: string | null;
  notes: string | null;
  language: string | null;
  foil: boolean;
}

export interface CSVImportResult {
  parsed: number;
  errors: string[];
  rows: CSVImportRow[];
}

export function parseCSV(content: string): Result<CSVImportResult> {
  try {
    const lines = content.split(/\r?\n/).filter((line) => line.trim());
    if (lines.length < 2) {
      return { success: false, error: new Error("CSV must have a header row and at least one data row") };
    }

    const headerLine = lines[0] as string;
    const headers = parseCSVLine(headerLine).map((h) => h.toLowerCase().trim());

    const nameIdx = headers.findIndex((h) => h === "name");
    if (nameIdx === -1) {
      return { success: false, error: new Error("CSV must have a 'Name' column") };
    }

    const qtyIdx = headers.findIndex((h) => h === "quantity");
    const condIdx = headers.findIndex((h) => h === "condition");
    const notesIdx = headers.findIndex((h) => h === "notes");
    const langIdx = headers.findIndex((h) => h === "language");
    const foilIdx = headers.findIndex((h) => h === "foil");

    const rows: CSVImportRow[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i] as string;
      if (!line.trim()) continue;

      const fields = parseCSVLine(line);
      const name = fields[nameIdx]?.trim();

      if (!name) {
        errors.push(`Row ${i + 1}: missing name`);
        continue;
      }

      const qtyStr = qtyIdx >= 0 ? fields[qtyIdx]?.trim() : "1";
      const quantity = parseInt(qtyStr ?? "1", 10);
      if (isNaN(quantity) || quantity < 1) {
        errors.push(`Row ${i + 1}: invalid quantity "${qtyStr}"`);
        continue;
      }

      const foilStr = foilIdx >= 0 ? fields[foilIdx]?.trim().toLowerCase() : "";
      rows.push({
        name,
        quantity,
        condition: condIdx >= 0 ? fields[condIdx]?.trim() || null : null,
        notes: notesIdx >= 0 ? fields[notesIdx]?.trim() || null : null,
        language: langIdx >= 0 ? fields[langIdx]?.trim().toUpperCase() || null : null,
        foil: foilStr === "true" || foilStr === "yes" || foilStr === "1",
      });
    }

    return {
      success: true,
      data: { parsed: rows.length, errors, rows },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error("Failed to parse CSV"),
    };
  }
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i] as string;

    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        fields.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
  }
  fields.push(current);
  return fields;
}
