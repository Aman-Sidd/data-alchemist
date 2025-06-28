// Example for validateTasks.ts
import type { Task, ValidationError } from "@/types";

export function validateTasks(data: Task[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const seenIds = new Set<string>();
  const requiredFields = [
    "TaskID",
    "TaskName",
    "Category",
    "Duration",
    "RequiredSkills",
    "PreferredPhases",
    "MaxConcurrent",
  ];

  // Check for missing required columns
  const actualColumns = Object.keys(data[0] || {});
  const missingColumns = requiredFields.filter((f) => !actualColumns.includes(f));
  if (missingColumns.length > 0) {
    errors.push({
      entity: "task",
      rowId: "",
      field: "",
      message: `Missing required columns: ${missingColumns.join(", ")}`,
    });
  }

  data.forEach((row, idx) => {
    // Missing required fields
    requiredFields.forEach((field) => {
      if (
        row[field as keyof Task] === undefined ||
        row[field as keyof Task] === null ||
        row[field as keyof Task] === ""
      ) {
        errors.push({
          entity: "task",
          rowId: row.TaskID ?? "",
          field,
          message: `Missing required field: ${field}`,
        });
      }
    });

    // Duplicate IDs
    if (row.TaskID) {
      if (seenIds.has(row.TaskID)) {
        errors.push({
          entity: "task",
          rowId: row.TaskID,
          field: "TaskID",
          message: "Duplicate TaskID",
        });
      }
      seenIds.add(row.TaskID);
    }

    // Duration normalization and validation
    let duration = row.Duration;
    if (typeof duration === "string") duration = Number((duration as string).trim());
    if (
      duration === undefined ||
      typeof duration !== "number" ||
      isNaN(duration) ||
      duration < 1
    ) {
      errors.push({
        entity: "task",
        rowId: row.TaskID ?? "",
        field: "Duration",
        message: "Duration must be a positive number",
      });
    }

    // MaxConcurrent normalization and validation
    let maxConcurrent = (row as any)["MaxConcurrent"];
    if (typeof maxConcurrent === "string")
      maxConcurrent = Number(maxConcurrent.trim());
    if (
      maxConcurrent === undefined ||
      maxConcurrent === null ||
      typeof maxConcurrent !== "number" ||
      isNaN(maxConcurrent) ||
      maxConcurrent < 1 ||
      !Number.isInteger(maxConcurrent)
    ) {
      errors.push({
        entity: "task",
        rowId: row.TaskID ?? "",
        field: "MaxConcurrent",
        message: "MaxConcurrent must be a positive integer",
      });
    }

    // RequiredSkills: should be a non-empty string
    const requiredSkills = (row as any)["RequiredSkills"];
    if (
      !requiredSkills ||
      typeof requiredSkills !== "string" ||
      requiredSkills.trim() === ""
    ) {
      errors.push({
        entity: "task",
        rowId: row.TaskID ?? "",
        field: "RequiredSkills",
        message: "RequiredSkills must be a non-empty string",
      });
    }

    // PreferredPhases: always validate the current value
    let preferredPhases = row.PreferredPhases;
    let isValid = false;
    if (typeof preferredPhases === "string") {
      const str = preferredPhases.trim();
      const isRange = /^\d+\s*-\s*\d+$/.test(str);
      const isArray = /^\[\s*\d+(?:\s*,\s*\d+)*\s*\]$/.test(str);
      isValid = isRange || isArray;
    } else if (Array.isArray(preferredPhases)) {
      function isNumberArray(arr: unknown): arr is number[] {
  return (
    Array.isArray(arr) &&
    arr.length > 0 &&
    arr.every((n) => typeof n === 'number' && !isNaN(n))
  );
}

      if (isNumberArray(preferredPhases)) {
        isValid = true;
      }

}

    if (!isValid) {
      errors.push({
        entity: "task",
        rowId: row.TaskID ?? "",
        field: "PreferredPhases",
        message:
          "PreferredPhases must be a range (e.g. 1-3) or array (e.g. [2,4,5])",
      });
    }
  });

  return errors;
}