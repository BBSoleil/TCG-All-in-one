import { describe, it, expect } from "vitest";
import { parseCSV } from "@/features/collection/services/csv-import";

describe("parseCSV", () => {
  it("parses basic CSV with name column", () => {
    const csv = "Name,Quantity\nPikachu,3\nCharizard,1";
    const result = parseCSV(csv);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.rows).toHaveLength(2);
    expect(result.data.rows[0]).toEqual({ name: "Pikachu", quantity: 3, condition: null, notes: null });
    expect(result.data.rows[1]).toEqual({ name: "Charizard", quantity: 1, condition: null, notes: null });
  });

  it("defaults quantity to 1 when no quantity column", () => {
    const csv = "Name\nDark Magician";
    const result = parseCSV(csv);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.rows[0]?.quantity).toBe(1);
  });

  it("parses condition and notes columns", () => {
    const csv = "Name,Quantity,Condition,Notes\nPikachu,2,Near Mint,My favorite card";
    const result = parseCSV(csv);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.rows[0]?.condition).toBe("Near Mint");
    expect(result.data.rows[0]?.notes).toBe("My favorite card");
  });

  it("handles quoted fields with commas", () => {
    const csv = 'Name,Notes\n"Dark Magician, the Ultimate",Great card';
    const result = parseCSV(csv);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.rows[0]?.name).toBe("Dark Magician, the Ultimate");
  });

  it("handles escaped quotes in fields", () => {
    const csv = 'Name,Notes\nPikachu,"Says ""hello"""';
    const result = parseCSV(csv);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.rows[0]?.notes).toBe('Says "hello"');
  });

  it("rejects CSV without name column", () => {
    const csv = "Card,Quantity\nPikachu,1";
    const result = parseCSV(csv);
    expect(result.success).toBe(false);
  });

  it("rejects CSV with only header", () => {
    const csv = "Name,Quantity";
    const result = parseCSV(csv);
    expect(result.success).toBe(false);
  });

  it("skips rows with empty name and reports error", () => {
    const csv = "Name,Quantity\nPikachu,1\n,2\nCharizard,1";
    const result = parseCSV(csv);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.rows).toHaveLength(2);
    expect(result.data.errors).toHaveLength(1);
    expect(result.data.errors[0]).toContain("missing name");
  });

  it("skips rows with invalid quantity and reports error", () => {
    const csv = "Name,Quantity\nPikachu,abc";
    const result = parseCSV(csv);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.rows).toHaveLength(0);
    expect(result.data.errors).toHaveLength(1);
  });

  it("handles case-insensitive headers", () => {
    const csv = "NAME,QUANTITY,CONDITION\nPikachu,2,Mint";
    const result = parseCSV(csv);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.rows[0]?.name).toBe("Pikachu");
    expect(result.data.rows[0]?.quantity).toBe(2);
    expect(result.data.rows[0]?.condition).toBe("Mint");
  });

  it("handles Windows-style line endings", () => {
    const csv = "Name,Quantity\r\nPikachu,1\r\nCharizard,2";
    const result = parseCSV(csv);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.rows).toHaveLength(2);
  });
});
