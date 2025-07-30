import { create } from "zustand";
import {
  validateClients,
  validateWorkers,
  validateTasks,
} from "@/lib/validators";

import type {
  Client,
  Worker,
  Task,
  EntityType,
  ValidationResult,
} from "@/types";

type EntityMap = {
  clients: Client[];
  workers: Worker[];
  tasks: Task[];
};

type ValidationMap = {
  clients: ValidationResult[];
  workers: ValidationResult[];
  tasks: ValidationResult[];
};

interface DataStore extends EntityMap {
  rulesConfig: any;
  validations: ValidationMap;
  setData: <T extends EntityType>(type: T, data: EntityMap[T]) => void;
  setValidations: <T extends EntityType>(
    type: T,
    result: ValidationResult[]
  ) => void;
  setRowAndValidate: <T extends EntityType>(
    type: T,
    rowIndex: number,
    updatedRow: EntityMap[T][number]
  ) => void;
}

export const useDataStore = create<DataStore>((set) => ({
  clients: [],
  workers: [],
  tasks: [],
  rulesConfig: {}, // Added default value for rulesConfig
  validations: {
    clients: [],
    workers: [],
    tasks: [],
  },

  setData: (type, data) =>
    set((state) => {
      const typedData = data.map((row, index) => ({
        ...row,
        id: index,
      }));

      return { ...state, [type]: typedData };
    }),

  setValidations: (type, result) =>
    set((state) => ({
      validations: {
        ...state.validations,
        [type]: result,
      },
    })),

  setRowAndValidate: <T extends EntityType>(
  type: T,
  rowIndex: number,
  updatedRow: EntityMap[T][number]
) =>
  set((state) => {
    const newClients = [...state.clients];
    const newWorkers = [...state.workers];
    const newTasks = [...state.tasks];

    if (type === "clients") newClients[rowIndex] = updatedRow as Client;
    if (type === "workers") newWorkers[rowIndex] = updatedRow as Worker;
    if (type === "tasks") newTasks[rowIndex] = updatedRow as Task;

    const taskIdSet = new Set(newTasks.map((t) => t.TaskID));
    const workerSkillsSet = new Set(
      newWorkers.flatMap((w) => w.Skills.split(",").map((s) => s.trim()))
    );

    const newValidations: ValidationMap = {
      clients: validateClients(newClients, taskIdSet, newWorkers), 
      workers: validateWorkers(newWorkers),
      tasks: validateTasks(newTasks, workerSkillsSet),
    };

    return {
      clients: newClients,
      workers: newWorkers,
      tasks: newTasks,
      validations: newValidations,
    };
  }),
}));