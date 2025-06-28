import type { Client, Task, ValidationError } from "@/types";

/**
 * Optionally pass allTasks for cross-entity validation (unknown references).
 */
export function validateClients(
  data: Client[],
  allTasks?: Task[]
): ValidationError[] {
  const errors: ValidationError[] = [];
  const seenIds = new Set<string>();
  const requiredFields = ["ClientID", "ClientName", "PriorityLevel", "RequestedTaskIDs"];

  // Check for missing required columns
  const actualColumns = Object.keys(data[0] || {});
  const missingColumns = requiredFields.filter(f => !actualColumns.includes(f));
  if (missingColumns.length > 0) {
    errors.push({
      entity: "client",
      rowId: "",
      field: "",
      message: `Missing required columns: ${missingColumns.join(", ")}`,
    });
  }

  // For unknown reference validation
  const allTaskIDs = allTasks ? new Set(allTasks.map(t => t.TaskID)) : undefined;

  data.forEach((row, idx) => {
    // Missing required fields
    requiredFields.forEach((field) => {
      if (
        row[field as keyof Client] === undefined ||
        row[field as keyof Client] === null ||
        row[field as keyof Client] === ""
      ) {
        errors.push({
          entity: "client",
          rowId: row.ClientID ?? "",
          field,
          message: `Missing required field: ${field}`,
        });
      }
    });

    // Duplicate IDs
    if (row.ClientID) {
      if (seenIds.has(row.ClientID)) {
        errors.push({
          entity: "client",
          rowId: row.ClientID,
          field: "ClientID",
          message: "Duplicate ClientID",
        });
      }
      seenIds.add(row.ClientID);
    }

    // Malformed AttributesJSON (if present and is a string)
    if (row.AttributesJSON && typeof row.AttributesJSON === "string") {
      try {
        JSON.parse(row.AttributesJSON);
      } catch {
        errors.push({
          entity: "client",
          rowId: row.ClientID ?? "",
          field: "AttributesJSON",
          message: "Malformed JSON in AttributesJSON",
        });
      }
    }

    // PriorityLevel normalization and validation
    let priorityLevel = row.PriorityLevel;
    if (typeof priorityLevel === "string") {
      priorityLevel = Number((priorityLevel as string).trim());
    }
    if (
      priorityLevel !== undefined &&
      (typeof priorityLevel !== "number" ||
        isNaN(priorityLevel) ||
        priorityLevel < 1 ||
        priorityLevel > 5)
    ) {
      errors.push({
        entity: "client",
        rowId: row.ClientID ?? "",
        field: "PriorityLevel",
        message: "PriorityLevel must be a number between 1 and 5",
      });
    }

    // RequestedTaskIDs: normalize for both CSV and XLSX, and check for unknown references
    let requestedTaskIDs = row.RequestedTaskIDs;
    if (typeof requestedTaskIDs === "string") {
      const split = (requestedTaskIDs as string).split(",");
      split.forEach((id, i) => {
        if (id.trim() === "") {
          errors.push({
            entity: "client",
            rowId: row.ClientID ?? "",
            field: "RequestedTaskIDs",
            message: `RequestedTaskIDs contains an empty TaskID at position ${i + 1}`,
          });
        }
      });
      requestedTaskIDs = split.map((id: string) => id.trim()).filter(Boolean);
    }
    if (typeof requestedTaskIDs === "number") {
      requestedTaskIDs = [String(requestedTaskIDs)];
    }
    if (!requestedTaskIDs) {
      requestedTaskIDs = [];
    }
    if (!Array.isArray(requestedTaskIDs) || requestedTaskIDs.length === 0) {
      errors.push({
        entity: "client",
        rowId: row.ClientID ?? "",
        field: "RequestedTaskIDs",
        message: "RequestedTaskIDs must be a non-empty array or CSV string",
      });
    }

    // Unknown references: RequestedTaskIDs not in tasks
    if (allTaskIDs && Array.isArray(requestedTaskIDs)) {
      requestedTaskIDs.forEach((taskId: string) => {
        if (!allTaskIDs.has(taskId)) {
          errors.push({
            entity: "client",
            rowId: row.ClientID ?? "",
            field: "RequestedTaskIDs",
            message: `RequestedTaskID "${taskId}" does not exist in tasks`,
          });
        }
      });
    }

    // GroupTag normalization (optional, if you want to ensure it's always a string or undefined)
    if (
      row.GroupTag !== undefined &&
      row.GroupTag !== null &&
      typeof row.GroupTag !== "string"
    ) {
      errors.push({
        entity: "client",
        rowId: row.ClientID ?? "",
        field: "GroupTag",
        message: "GroupTag must be a string if present",
      });
    }
  });

  return errors;
}