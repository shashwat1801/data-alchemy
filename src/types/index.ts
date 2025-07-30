export type EntityType = "clients" | "workers" | "tasks";

export interface Client {
  ClientID: string;
  ClientName: string;
  PriorityLevel: string;
  RequestedTaskIDs: string;
  GroupTag?: string;
  AttributesJSON: string;
}

export interface Worker {
  WorkerGroup: any;
  WorkerID: string;
  WorkerName: string;
  Skills: string;
  AvailableSlots: string;
  MaxLoadPerPhase: string;
}

export interface Task {
  TaskID: string;
  TaskName: string;
  Duration: string;
  RequiredSkills: string;
  PreferredPhases: string;
  MaxConcurrent: string;
}

export type RowData = Client | Worker | Task;

export type ValidationResult = {
  rowIndex: number;
  errors: Record<string, string>;
};
