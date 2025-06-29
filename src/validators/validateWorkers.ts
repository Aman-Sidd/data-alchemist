import type { Worker, ValidationError } from "@/types";

export function validateWorkers(data: Worker[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const seenIds = new Set<string>();
  const requiredFields = ["WorkerID", "WorkerName", "Skills", "AvailableSlots", "MaxLoadPerPhase"];

  data.forEach((row, idx) => {
    // Strict normalization and validation for AvailableSlots
    let availableSlots: number[] = [];
    let availableSlotsRaw = row.AvailableSlots;

    if (typeof availableSlotsRaw === "string") {
      const trimmed = (availableSlotsRaw as string).trim();
      if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        try {
          const parsed = JSON.parse(trimmed);
          if (
            Array.isArray(parsed) &&
            parsed.length > 0 &&
            parsed.every(
              (n) =>
                typeof n === "number" &&
                !isNaN(n) &&
                n !== null &&
                n !== undefined
            )
          ) {
            availableSlots = parsed;
          } else {
            // Invalid array or contains invalid values
            availableSlots = [];
          }
        } catch {
          // JSON parse failed
          availableSlots = [];
        }
      } else {
        // Only allow a single number, not CSV or any other format
        if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
          availableSlots = [Number(trimmed)];
        } else {
          // Invalid format (e.g. "2,4" or anything else)
          availableSlots = [];
        }
      }
    } else if (Array.isArray(availableSlotsRaw)) {
      // Already an array, validate all values
      if (
        availableSlotsRaw.length > 0 &&
        availableSlotsRaw.every(
          (n) =>
            typeof n === "number" &&
            !isNaN(n) &&
            n !== null &&
            n !== undefined
        )
      ) {
        availableSlots = availableSlotsRaw;
      } else {
        availableSlots = [];
      }
    } else if (typeof availableSlotsRaw === "number") {
      availableSlots = [availableSlotsRaw];
    } else {
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

    // AvailableSlots: must be a non-empty array of valid numbers
    if (
      !Array.isArray(availableSlots) ||
      availableSlots.length === 0 ||
      availableSlots.some((n) => typeof n !== "number" || isNaN(n))
    ) {
      errors.push({
        entity: "worker",
        rowId: row.WorkerID ?? "",
        field: "AvailableSlots",
        message: "AvailableSlots must be a non-empty array of valid numbers (e.g. [1,2,3])",
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