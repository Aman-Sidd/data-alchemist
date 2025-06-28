export interface Client {
  ClientID: string;
  ClientName: string;
  PriorityLevel: number;
  RequestedTaskIDs: string[]; // Array of task IDs
  GroupTag?: string;
  AttributesJSON?: Record<string, any>; // Parsed JSON object
}

export interface Worker {
  WorkerID: string;
  WorkerName: string;
  Skills: string;
  AvailableSlots: number[]; // Array of numbers
  MaxLoadPerPhase: number;
  WorkerGroup?: string;
  QualificationLevel?: string;
}

export interface Task {
  TaskID: string;
  TaskName: string;
  Category: string;
  Duration: number;
  RequiredSkills: string;
  PreferredPhases: string; // e.g. "1-3" or "[2,4,5]"
  MaxConcurrent: number;
}

export interface ValidationError {
  entity: "client" | "worker" | "task";
  rowId: string;
  field: string;
  message: string;
}
