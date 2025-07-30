"use client";

import FileUploader from "@/components/FileUploader";
import { useDataStore } from "@/store/useDataStore";
import DataGridView from "@/components/DataGridView";
const Button = (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button {...props} />
);

import {
  validateClients,
  validateWorkers,
  validateTasks,
} from "@/lib/validators";
import { useState } from "react";

export default function HomeClient() {
  const setData = useDataStore((state) => state.setData);
  const setValidations = useDataStore((s) => s.setValidations);
  const clients = useDataStore((state) => state.clients);
  const workers = useDataStore((state) => state.workers);
  const tasks = useDataStore((state) => state.tasks);
  const validations = useDataStore((s) => s.validations);

  const [showDebug, setShowDebug] = useState(false);
  const [ruleInput, setRuleInput] = useState("");
  const [parsedRule, setParsedRule] = useState("");

  const handleParseRule = () => {
    if (ruleInput.toLowerCase().includes("prioritylevel 5")) {
      setParsedRule("Filter clients where PriorityLevel = 5");
    } else if (ruleInput.toLowerCase().includes("match tasks to workers")) {
      setParsedRule("Map Task.RequiredSkills ⊆ Worker.Skills");
    } else {
      setParsedRule("Unknown rule or format not recognized.");
    }
  };

  const handleDataParsed = (data: any[], fileType: string) => {
    const type = fileType as "clients" | "workers" | "tasks";
    const dataWithId = data.map((row, i) => ({ ...row, id: i }));
    setData(type, dataWithId);

    const { clients: newClients, workers: newWorkers, tasks: newTasks } =
      useDataStore.getState();

    const taskIdSet = new Set(newTasks.map((t) => t.TaskID));
    const workerSkillsSet = new Set(
      newWorkers.flatMap((w) =>
        w.Skills?.split(",").map((s: string) => s.trim()) ?? []
      )
    );

    setValidations("clients", validateClients(newClients, taskIdSet, newWorkers));
    setValidations("workers", validateWorkers(newWorkers));
    setValidations("tasks", validateTasks(newTasks, workerSkillsSet));
  };

  const handleRemoveFile = (type: "clients" | "workers" | "tasks") => {
    setData(type, []);
    setValidations(type, []);
  };

  return (
    <div className="px-8 py-12 bg-gradient-to-br from-gray-50 to-white min-h-screen">
      {/* Hero */}
      <header className="mb-12 text-center">
        <h1 className="text-5xl font-bold text-gray-900 tracking-tight">
          📊 Data Alchemy
        </h1>
        <p className="mt-3 text-gray-600 text-lg">
          Upload datasets and validate cross-entity relationships.
        </p>
      </header>

      {/* Uploaders */}
      <section className="bg-white rounded-lg shadow p-6 mb-12 border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Upload CSV/XLSX Files</h2>
        
        <button
  onClick={() => {
    const { clients, workers, tasks, rulesConfig } = useDataStore.getState();

    if (!clients.length && !workers.length && !tasks.length) {
      alert("No data to export!");
      return;
    }

    const toCSV = (arr: any[]) =>
      [Object.keys(arr[0] || {}).join(","), ...arr.map(obj => Object.values(obj).join(","))].join("\n");

    const download = (content: string, filename: string, type = "text/csv") => {
      const blob = new Blob([content], { type });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
    };

    download(toCSV(clients), "clients.csv");
    download(toCSV(workers), "workers.csv");
    download(toCSV(tasks), "tasks.csv");
    download(JSON.stringify(rulesConfig || {}, null, 2), "rules.json", "application/json");
  }}
  className="bg-green-600 text-white px-4 py-2 mb-5 rounded hover:bg-green-700 transition"
>
  Export Filtered Data
</button> 
        
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <FileUploader
            label="Clients"
            onDataParsed={handleDataParsed}
            onRemove={() => handleRemoveFile("clients")}
          />
          <FileUploader
            label="Workers"
            onDataParsed={handleDataParsed}
            onRemove={() => handleRemoveFile("workers")}
          />
          <FileUploader
            label="Tasks"
            onDataParsed={handleDataParsed}
            onRemove={() => handleRemoveFile("tasks")}
          />
        </div>
      </section>

      {/* Data Tables */}
      <section className="space-y-12">
        <DataGridView rows={clients} title="clients" />
        <DataGridView rows={workers} title="workers" />
        <DataGridView rows={tasks} title="tasks" />
      </section>

      {/* Rule Engine */}
      <section className="mt-12 bg-white rounded-lg shadow p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Rule Engine</h2>

        <label htmlFor="ruleInput" className="block text-sm font-medium text-gray-700 mb-1">
          Give a prompt for rule in natural language:
        </label>
        <textarea
          id="ruleInput"
          rows={3}
          className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-blue-200"
          placeholder="e.g. Prioritize clients with PriorityLevel 5 and match tasks to workers with matching skills"
          onChange={(e) => setRuleInput(e.target.value)}
        />

        <button
          className="mt-4 px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          onClick={handleParseRule}
        >
          Convert to Rule
        </button>

        {parsedRule && (
          <div className="mt-4 text-sm text-gray-800 bg-gray-100 p-3 rounded border border-gray-300">
            <strong>Parsed Rule:</strong> {parsedRule}
          </div>
        )}
      </section>

      {/* Debug Output */}
      <section className="mt-10">
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="text-sm text-blue-600 underline hover:text-blue-800"
        >
          {showDebug ? "Hide" : "Show"} Debug Output
        </button>

        {showDebug && (
          <pre className="mt-4 p-4 bg-gray-100 rounded text-xs text-gray-700 overflow-x-auto border">
            {JSON.stringify(validations, null, 2)}
          </pre>
        )}
      </section>
    </div>
  );
}
