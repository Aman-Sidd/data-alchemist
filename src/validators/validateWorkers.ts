import type { Worker, ValidationError } from "@/types";

export function validateWorkers(data: Worker[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const seenIds = new Set<string>();
  const requiredFields = ["WorkerID", "WorkerName", "Skills", "AvailableSlots", "MaxLoadPerPhase"];

  data.forEach((row, idx) => {
    // Normalize AvailableSlots: handle JSON array string, CSV string, or array (for UI edits)
    let availableSlots: string | number | number[] | undefined = row.AvailableSlots;
    if (typeof availableSlots === "string") {
      const trimmed = (availableSlots as string).trim();
      if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        try {
          availableSlots = JSON.parse(trimmed);
        } catch {
          availableSlots = [];
        }
      } else {
        availableSlots = trimmed
          .split(",")
          .map((n: string) => Number(n.trim()))
          .filter((n: number) => !isNaN(n));
      }
    }
    if (typeof availableSlots === "number") {
      availableSlots = [availableSlots];
    }
    if (!availableSlots) {
      availableSlots = [];
    }

    // MaxLoadPerPhase normalization
    let maxLoad = row.MaxLoadPerPhase;
    if (typeof maxLoad === "string") {
      maxLoad = Number((maxLoad as string).trim());
    }

    // Missing required fields
    requiredFields.forEach((field) => {
      if (
        row[field as keyof Worker] === undefined ||
        row[field as keyof Worker] === null ||
        row[field as keyof Worker] === ""
      ) {
        errors.push({
          entity: "worker",
          rowId: row.WorkerID ?? "",
          field,
          message: `Missing required field: ${field}`,
        });
      }
    });

    // Duplicate IDs
    if (row.WorkerID) {
      if (seenIds.has(row.WorkerID)) {
        errors.push({
          entity: "worker",
          rowId: row.WorkerID,
          field: "WorkerID",
          message: "Duplicate WorkerID",
        });
      }
      seenIds.add(row.WorkerID);
    }

    // Skills: should be a non-empty string
    if (!row.Skills || typeof row.Skills !== "string" || row.Skills.trim() === "") {
      errors.push({
        entity: "worker",
        rowId: row.WorkerID ?? "",
        field: "Skills",
        message: "Skills must be a non-empty string",
      });
    }

    // AvailableSlots: should be a non-empty array of numbers
    if (
      !Array.isArray(availableSlots) ||
      availableSlots.length === 0 ||
      availableSlots.some((n) => typeof n !== "number" || isNaN(n))
    ) {
      errors.push({
        entity: "worker",
        rowId: row.WorkerID ?? "",
        field: "AvailableSlots",
        message: "AvailableSlots must be a non-empty array of numbers",
      });
    }

    // MaxLoadPerPhase: must be a positive integer
    if (
      maxLoad === undefined ||
      maxLoad === null ||
      typeof maxLoad !== "number" ||
      isNaN(maxLoad) ||
      maxLoad < 1 ||
      !Number.isInteger(maxLoad)
    ) {
      errors.push({
        entity: "worker",
        rowId: row.WorkerID ?? "",
        field: "MaxLoadPerPhase",
        message: "MaxLoadPerPhase must be a positive integer",
      });
    }

    // Overloaded workers: AvailableSlots.length < MaxLoadPerPhase
    if (
      Array.isArray(availableSlots) &&
      typeof maxLoad === "number" &&
      availableSlots.length < maxLoad
    ) {
      errors.push({
        entity: "worker",
        rowId: row.WorkerID ?? "",
        field: "AvailableSlots",
        message: "AvailableSlots count is less than MaxLoadPerPhase (worker overloaded) i.e. AvailableSlots.length < MaxLoadPerPhase",
      });
    }
  });

  return errors;
}