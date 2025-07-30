import type { Client, Worker, Task, ValidationResult } from "@/types";

//Validate Clients
export function validateClients(
  clients: Client[],
  taskIdSet: Set<string>,
  allWorkers: Worker[]
): ValidationResult[] {
  const errors: ValidationResult[] = [];
  const workerGroups = new Set(allWorkers.map(w => w.WorkerGroup?.trim()).filter(Boolean));

  clients.forEach((client, index) => {
    const rowErrors: Record<string, string> = {};

    if (!client.ClientID) rowErrors.ClientID = "Missing ClientID";
    if (!client.ClientName) rowErrors.ClientName = "Missing ClientName";

    const priority = parseInt(client.PriorityLevel);
    if (isNaN(priority) || priority < 1 || priority > 5) {
      rowErrors.PriorityLevel = "Invalid priority level (1–5)";
    }

    if (!client.RequestedTaskIDs) {
      rowErrors.RequestedTaskIDs = "Missing RequestedTaskIDs";
    } else {
      const requestedIds = client.RequestedTaskIDs.split(",").map((id) => id.trim());
      const invalidIds = requestedIds.filter((id) => !taskIdSet.has(id));
      if (invalidIds.length > 0) {
        rowErrors.RequestedTaskIDs = `Invalid TaskID(s): ${invalidIds.join(", ")}`;
      }
    }

    try {
      JSON.parse(client.AttributesJSON);
    } catch {
      rowErrors.AttributesJSON = "Invalid JSON in AttributesJSON";
    }

    // Grouptag validation
    if (client.GroupTag && !workerGroups.has(client.GroupTag.trim())) {
      rowErrors.GroupTag = `No workers available in group '${client.GroupTag}'`;
    }

    if (Object.keys(rowErrors).length > 0) {
      errors.push({ rowIndex: (client as any).id ?? index, errors: rowErrors });
    }
  });

  return errors;
}

// Validate Workers
export function validateWorkers(workers: Worker[]): ValidationResult[] {
  const errors: ValidationResult[] = [];
  const seenWorkerIds = new Set<string>();

  workers.forEach((worker, index) => {
    const rowErrors: Record<string, string> = {};

    if (!worker.WorkerID) rowErrors.WorkerID = "Missing WorkerID";
    if (!worker.WorkerName) rowErrors.WorkerName = "Missing WorkerName";
    if (!worker.Skills) rowErrors.Skills = "Missing Skills";
    if (!worker.AvailableSlots) rowErrors.AvailableSlots = "Missing AvailableSlots";
    if (!worker.MaxLoadPerPhase) rowErrors.MaxLoadPerPhase = "Missing MaxLoadPerPhase";

    if (seenWorkerIds.has(worker.WorkerID)) {
      rowErrors.WorkerID = "Duplicate WorkerID";
    } else {
      seenWorkerIds.add(worker.WorkerID);
    }

    if (typeof worker.Skills !== "string") {
      rowErrors.Skills = "Skills must be a comma-separated string";
    }

    try {
      const slots = JSON.parse(worker.AvailableSlots);
      if (!Array.isArray(slots) || slots.some((s) => typeof s !== "number")) {
        rowErrors.AvailableSlots = "Must be a JSON array of numbers";
      }
    } catch {
      rowErrors.AvailableSlots = "Invalid JSON in AvailableSlots";
    }

    const maxLoad = parseInt(worker.MaxLoadPerPhase);
    if (isNaN(maxLoad) || maxLoad <= 0) {
      rowErrors.MaxLoadPerPhase = "Invalid MaxLoadPerPhase (must be > 0)";
    }

    if (Object.keys(rowErrors).length > 0) {
      errors.push({ rowIndex: (worker as any).id ?? index, errors: rowErrors });
    }
  });

  return errors;
}

// Validate Tasks
export function validateTasks(tasks: Task[], workerSkillsSet?: Set<string>): ValidationResult[] {
  const errors: ValidationResult[] = [];
  const taskIdCount = new Map<string, number>();

  tasks.forEach((t) => {
    taskIdCount.set(t.TaskID, (taskIdCount.get(t.TaskID) || 0) + 1);
  });

  const duplicateTaskIds = new Set(
    Array.from(taskIdCount.entries())
      .filter(([, count]) => count > 1)
      .map(([taskId]) => taskId)
  );

  tasks.forEach((task, index) => {
    const rowErrors: Record<string, string> = {};

    if (!task.TaskID) rowErrors.TaskID = "Missing TaskID";
    if (!task.TaskName) rowErrors.TaskName = "Missing TaskName";
    if (!task.Duration) rowErrors.Duration = "Missing Duration";
    if (!task.RequiredSkills) rowErrors.RequiredSkills = "Missing RequiredSkills";
    if (!task.PreferredPhases) rowErrors.PreferredPhases = "Missing PreferredPhases";
    if (!task.MaxConcurrent) rowErrors.MaxConcurrent = "Missing MaxConcurrent";

   if (duplicateTaskIds.has(task.TaskID)) {
  rowErrors.TaskID = "Duplicate TaskID";
}

    const duration = parseInt(task.Duration);
    if (!isNaN(duration) && duration < 1) {
      rowErrors.Duration = "Invalid Duration (must be ≥ 1)";
    }

    const concurrent = parseInt(task.MaxConcurrent);
    if (!isNaN(concurrent) && concurrent < 1) {
      rowErrors.MaxConcurrent = "Invalid MaxConcurrent (must be ≥ 1)";
    }

    if (task.RequiredSkills && workerSkillsSet && !duplicateTaskIds.has(task.TaskID)) {
      const requiredSkills = task.RequiredSkills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const unmatched = requiredSkills.filter((skill) => !workerSkillsSet.has(skill));
     if (unmatched.length > 0) {
  rowErrors.RequiredSkills = `Skill(s) not covered by any worker: ${unmatched.join(", ")}`;
  rowErrors._rowLevel = "Unassignable task: no workers cover required skills";
}
    }

    if (task.PreferredPhases) {
      const val = task.PreferredPhases.trim();

      try {
        if (val.includes("-")) {
          const [start, end] = val.split("-").map((v) => parseInt(v.trim()));
          if (isNaN(start) || isNaN(end) || start > end) {
            rowErrors.PreferredPhases = "Invalid range in PreferredPhases";
          }
        } else {
          const parsed = JSON.parse(val);
          if (!Array.isArray(parsed) || parsed.some((p) => typeof p !== "number")) {
            rowErrors.PreferredPhases = "PreferredPhases must be a numeric array";
          }
        }
      } catch {
        rowErrors.PreferredPhases = "Invalid format in PreferredPhases";
      }
    }

    if (Object.keys(rowErrors).length > 0) {
      errors.push({ rowIndex: (task as any).id ?? index, errors: rowErrors });
    }
  });

  return errors;
}
