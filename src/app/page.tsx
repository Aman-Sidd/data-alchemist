"use client";
import Image from "next/image";
import { useState } from "react";
import FileUploader from "@/components/FileUploader";
import DataGrid from "@/components/DataGrid";
import ValidationPanel from "@/components/ValidationPanel";
import NaturalSearch from "@/components/NaturalSearch";
import RuleBuilder, { RuleType } from "@/components/RuleBuilder";
import RuleList from "@/components/RuleList";
import ExportRulesButton from "@/components/ExportRulesButton";
import ExportButton from "@/components/ExportButton";
import { validateClients } from "@/validators/validateClients";
import { validateWorkers } from "@/validators/validateWorkers";
import { validateTasks } from "@/validators/validateTasks";
import { searchEntitiesWithNaturalLanguage } from "@/ai/naturalSearch";
import type { Client, Worker, Task, ValidationError } from "@/types";
import PriorityConfigurator from "@/components/PriorityConfigurator";

export default function Home() {
  const [clients, setClients] = useState<Client[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [activeEntity, setActiveEntity] = useState<"clients" | "workers" | "tasks">("clients");
  const [filteredClients, setFilteredClients] = useState<Client[] | null>(null);
  const [filteredWorkers, setFilteredWorkers] = useState<Worker[] | null>(null);
  const [filteredTasks, setFilteredTasks] = useState<Task[] | null>(null);

  // Rules state
  const [rules, setRules] = useState<any[]>([]);
  const [priorities, setPriorities] = useState<Record<string, number>>({
    PriorityLevel: 5,
    RequestedTaskFulfillment: 5,
    Fairness: 5,
    Workload: 5,
  });

  // Example columns for DataGrid (customize as needed)
  const clientColumns = [
    { accessorKey: "ClientID", header: "ClientID" },
    { accessorKey: "ClientName", header: "ClientName" },
    { accessorKey: "PriorityLevel", header: "PriorityLevel" },
    { accessorKey: "RequestedTaskIDs", header: "RequestedTaskIDs" },
    { accessorKey: "GroupTag", header: "GroupTag" },
    { accessorKey: "AttributesJSON", header: "AttributesJSON" },
  ];
  const workerColumns = [
    { accessorKey: "WorkerID", header: "WorkerID" },
    { accessorKey: "WorkerName", header: "WorkerName" },
    { accessorKey: "Skills", header: "Skills" },
    { accessorKey: "AvailableSlots", header: "AvailableSlots" },
    { accessorKey: "MaxLoadPerPhase", header: "MaxLoadPerPhase" },
    { accessorKey: "WorkerGroup", header: "WorkerGroup" },
    { accessorKey: "QualificationLevel", header: "QualificationLevel" },
  ];
  const taskColumns = [
    { accessorKey: "TaskID", header: "TaskID" },
    { accessorKey: "TaskName", header: "TaskName" },
    { accessorKey: "Category", header: "Category" },
    { accessorKey: "Duration", header: "Duration" },
    { accessorKey: "RequiredSkills", header: "RequiredSkills" },
    { accessorKey: "PreferredPhases", header: "PreferredPhases" },
    { accessorKey: "MaxConcurrent", header: "MaxConcurrent" },
  ];

  // Handle file parsing
  const handleFileParsed = (entityType: "clients" | "workers" | "tasks", parsedData: any[]) => {
    if (entityType === "clients") {
      setClients(parsedData);
      setActiveEntity("clients");
      setErrors(validateClients(parsedData));
    } else if (entityType === "workers") {
      setWorkers(parsedData);
      setActiveEntity("workers");
      setErrors(validateWorkers(parsedData));
    } else if (entityType === "tasks") {
      setTasks(parsedData);
      setActiveEntity("tasks");
      setErrors(validateTasks(parsedData));
    }
  };

  // Handle cell edit
  const handleCellEdit = (rowIndex: number, columnId: string, newValue: any) => {
    if (activeEntity === "clients") {
      const updated = [...clients];
      updated[rowIndex] = { ...updated[rowIndex], [columnId]: newValue };
      setClients(updated);
      setErrors(validateClients(updated));
    } else if (activeEntity === "workers") {
      const updated = [...workers];
      updated[rowIndex] = { ...updated[rowIndex], [columnId]: newValue };
      setWorkers(updated);
      setErrors(validateWorkers(updated));
    } else if (activeEntity === "tasks") {
      const updated = [...tasks];
      updated[rowIndex] = { ...updated[rowIndex], [columnId]: newValue };
      setTasks(updated);
      setErrors(validateTasks(updated));
    }
  };

  // Filter errors for the active entity and map to DataGrid cellErrors
  const cellErrors = errors
    .filter((e) => {
      if (activeEntity === "clients" && e.entity === "client") return true;
      if (activeEntity === "workers" && e.entity === "worker") return true;
      if (activeEntity === "tasks" && e.entity === "task") return true;
      return false;
    })
    .map((e) => ({
      rowIndex:
        (activeEntity === "clients"
          ? clients
          : activeEntity === "workers"
          ? workers
          : tasks
        ).findIndex((row: any) => row[`${activeEntity.slice(0, -1)}ID`] === e.rowId),
      columnId: e.field,
      message: e.message,
    }));

  // Example: Use the current clients data for NL search
  async function handleNLSearch() {
    const filtered = await searchEntitiesWithNaturalLanguage(
      "Show clients with PriorityLevel 5",
      clients,
      "clients"
    );
    console.log(filtered);
    // You can also set this to state and render in the UI if you want
  }

  // Rule handlers
  const handleAddRule = (rule: any) => {
    setRules((prev) => [...prev, rule]);
  };

  const handleDeleteRule = (index: number) => {
    setRules((prev) => prev.filter((_, i) => i !== index));
  };

  // For RuleBuilder group lists
  const clientGroups = Array.from(new Set(clients.map(c => c.GroupTag).filter(Boolean)));
  const workerGroups = Array.from(new Set(workers.map(w => w.WorkerGroup).filter(Boolean)));

  // To sync priorities from PriorityConfigurator, you can pass a setter:
  function handlePrioritiesChange(newPriorities: Record<string, number>) {
    setPriorities(newPriorities);
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-8 pb-20 gap-8">
      <main className="flex flex-row gap-8 w-full max-w-7xl">
        {/* Main content (left) */}
        <div className="flex-1 flex flex-col gap-8">
          <h1 className="text-3xl font-bold mb-2">Data Alchemist</h1>
          <FileUploader onFileParsed={handleFileParsed} />
          <div className="flex gap-4">
            <button
              className={`px-3 py-1 rounded ${activeEntity === "clients" ? "bg-primary text-white" : "bg-muted"}`}
              onClick={() => {
                setActiveEntity("clients");
                setErrors(validateClients(clients));
              }}
            >
              Clients
            </button>
            <button
              className={`px-3 py-1 rounded ${activeEntity === "workers" ? "bg-primary text-white" : "bg-muted"}`}
              onClick={() => {
                setActiveEntity("workers");
                setErrors(validateWorkers(workers));
              }}
            >
              Workers
            </button>
            <button
              className={`px-3 py-1 rounded ${activeEntity === "tasks" ? "bg-primary text-white" : "bg-muted"}`}
              onClick={() => {
                setActiveEntity("tasks");
                setErrors(validateTasks(tasks));
              }}
            >
              Tasks
            </button>
          </div>
          {/* Natural Language Search */}
          {activeEntity === "clients" && (
            <NaturalSearch
              entityType="clients"
              data={clients}
              columns={clientColumns}
              onFiltered={setFilteredClients}
            />
          )}
          {activeEntity === "workers" && (
            <NaturalSearch
              entityType="workers"
              data={workers}
              columns={workerColumns}
              onFiltered={setFilteredWorkers}
            />
          )}
          {activeEntity === "tasks" && (
            <NaturalSearch
              entityType="tasks"
              data={tasks}
              columns={taskColumns}
              onFiltered={setFilteredTasks}
            />
          )}
          <div>
            {activeEntity === "clients" && (
              <DataGrid
                data={filteredClients ?? clients}
                columns={clientColumns}
                onCellEdit={handleCellEdit}
                cellErrors={cellErrors}
              />
            )}
            {activeEntity === "workers" && (
              <DataGrid
                data={filteredWorkers ?? workers}
                columns={workerColumns}
                onCellEdit={handleCellEdit}
                cellErrors={cellErrors}
              />
            )}
            {activeEntity === "tasks" && (
              <DataGrid
                data={filteredTasks ?? tasks}
                columns={taskColumns}
                onCellEdit={handleCellEdit}
                cellErrors={cellErrors}
              />
            )}
          </div>
          {/* Rule Builder, Rule List, Export */}
          <div className="flex flex-col gap-4">
            <RuleBuilder
              taskIDs={tasks.map(t => t.TaskID)}
              clientGroups={clientGroups}
              workerGroups={workerGroups}
              onAddRule={handleAddRule}
            />
            <RuleList rules={rules} onDelete={handleDeleteRule} />
            <PriorityConfigurator onChange={handlePrioritiesChange} />
            <ExportRulesButton rules={rules} />
            <ExportButton
              clients={clients}
              workers={workers}
              tasks={tasks}
              rules={rules}
              priorities={priorities}
            />
          </div>
        </div>
        {/* Validation Panel (right) */}
        <div className="w-[350px] sticky top-15 h-fit shrink-0">
          <ValidationPanel errors={errors} />
        </div>
      </main>
    </div>
  );
}
