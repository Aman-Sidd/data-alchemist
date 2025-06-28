import { saveAs } from 'file-saver';

// Utility to remove __EMPTY keys from an object
function cleanObject<T extends Record<string, any>>(obj: T): T {
  const cleaned: Record<string, any> = {};
  for (const key in obj) {
    if (!key.startsWith("__EMPTY")) {
      cleaned[key] = obj[key];
    }
  }
  return cleaned as T;
}

function toCSV<T extends Record<string, any>>(arr: T[]): string {
  if (!arr.length) return "";
  // Clean all objects to remove __EMPTY keys
  const cleanedArr = arr.map(cleanObject);
  // Get the union of all keys in all objects
  const keys = Array.from(
    cleanedArr.reduce((set, obj) => {
      Object.keys(obj).forEach(k => set.add(k));
      return set;
    }, new Set<string>())
  );
  const header = keys.join(",");
  const rows = cleanedArr.map(obj =>
    keys.map(key => {
      const val = obj.hasOwnProperty(key) ? obj[key] : "";
      if (Array.isArray(val)) {
        return `"${val.join(",")}"`;
      }
      if (typeof val === "object" && val !== null) {
        const json = JSON.stringify(val).replace(/"/g, '""');
        return `"${json}"`;
      }
      if (typeof val === "string" && (val.includes(",") || val.includes('"'))) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val ?? "";
    }).join(",")
  );
  return [header, ...rows].join("\n");
}

export function exportAllData<
  TClient extends Record<string, any>,
  TWorker extends Record<string, any>,
  TTask extends Record<string, any>,
  TRule = any,
  TPriority extends Record<string, number> = Record<string, number>
>({
  clients,
  workers,
  tasks,
  rules,
  priorities
}: {
  clients: TClient[];
  workers: TWorker[];
  tasks: TTask[];
  rules: TRule[];
  priorities: TPriority;
}) {
  if (clients && clients.length > 0) {
    const clientsCSV = new Blob([toCSV(clients)], { type: "text/csv" });
    saveAs(clientsCSV, "clients_cleaned.csv");
  }
  if (workers && workers.length > 0) {
    const workersCSV = new Blob([toCSV(workers)], { type: "text/csv" });
    saveAs(workersCSV, "workers_cleaned.csv");
  }
  if (tasks && tasks.length > 0) {
    const tasksCSV = new Blob([toCSV(tasks)], { type: "text/csv" });
    saveAs(tasksCSV, "tasks_cleaned.csv");
  }
  if ((rules && rules.length > 0) || (priorities && Object.keys(priorities).length > 0)) {
    const rulesJSON = new Blob(
      [JSON.stringify({ rules, priorities }, null, 2)],
      { type: "application/json" }
    );
    saveAs(rulesJSON, "rules.json");
  }
}