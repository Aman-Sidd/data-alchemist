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
import type { Client, Worker, Task, ValidationError, EntityType } from "@/types";
import PriorityConfigurator from "@/components/PriorityConfigurator";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import MainPanel from "@/components/layout/MainPanel";


export default function Home() {
  const [clients, setClients] = useState<Client[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [errors, setErrors] = useState<{
    clients: ValidationError[];
    workers: ValidationError[];
    tasks: ValidationError[];
  }>({
    clients: [],
    workers: [],
    tasks: [],
  });
  const [activeEntity, setActiveEntity] = useState<EntityType>("clients");
  const [filteredClients, setFilteredClients] = useState<Client[] | null>(null);
  const [filteredWorkers, setFilteredWorkers] = useState<Worker[] | null>(null);
  const [filteredTasks, setFilteredTasks] = useState<Task[] | null>(null);

  // Rules state
  const [rules, setRules] = useState<RuleType[]>([]);
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
  const handleFileParsed = (
    entityType: EntityType,
    parsedData: Client[] | Worker[] | Task[]
  ) => {
    if (entityType === "clients") {
      setClients(parsedData as Client[]);
      setActiveEntity("clients");
      setErrors((prev) => ({
        ...prev,
        clients: validateClients(parsedData as Client[]),
      }));
    } else if (entityType === "workers") {
      setWorkers(parsedData as Worker[]);
      setActiveEntity("workers");
      setErrors((prev) => ({
        ...prev,
        workers: validateWorkers(parsedData as Worker[]),
      }));
    } else if (entityType === "tasks") {
      setTasks(parsedData as Task[]);
      setActiveEntity("tasks");
      setErrors((prev) => ({
        ...prev,
        tasks: validateTasks(parsedData as Task[]),
      }));
    }
  };

  // Handle cell edit
  const handleCellEdit = (
    rowIndex: number,
    columnId: string,
    newValue: any
  ) => {
    if (activeEntity === "clients") {
      const updated = [...clients];
      updated[rowIndex] = { ...updated[rowIndex], [columnId]: newValue };
      setClients(updated);
      setErrors((prev) => ({
        ...prev,
        clients: validateClients(updated),
      }));
    } else if (activeEntity === "workers") {
      const updated = [...workers];
      updated[rowIndex] = { ...updated[rowIndex], [columnId]: newValue };
      setWorkers(updated);
      setErrors((prev) => ({
        ...prev,
        workers: validateWorkers(updated),
      }));
    } else if (activeEntity === "tasks") {
      const updated = [...tasks];
      updated[rowIndex] = { ...updated[rowIndex], [columnId]: newValue };
      setTasks(updated);
      setErrors((prev) => ({
        ...prev,
        tasks: validateTasks(updated),
      }));
    }
  };

  // Filter errors for the active entity and map to DataGrid cellErrors
  const cellErrors = (
    activeEntity === "clients"
      ? errors.clients
      : activeEntity === "workers"
      ? errors.workers
      : errors.tasks
  ).map((e) => ({
    rowIndex:
      (activeEntity === "clients"
        ? clients
        : activeEntity === "workers"
        ? workers
        : tasks
      ).findIndex(
        (row: any) => row[`${activeEntity.slice(0, -1)}ID`] === e.rowId
      ),
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
  const handleAddRule = (rule: RuleType) => {
    setRules((prev) => [...prev, rule]);
  };

  const handleDeleteRule = (index: number) => {
    setRules((prev) => prev.filter((_, i) => i !== index));
  };

  // For RuleBuilder group lists
  const clientGroups: string[] = Array.from(
  new Set(
    clients
      .map((c) => c.GroupTag)
      .filter((g): g is string => typeof g === "string" && !!g)
  )
);

const workerGroups: string[] = Array.from(
  new Set(
    workers
      .map((w) => w.WorkerGroup)
      .filter((g): g is string => typeof g === "string" && !!g)
  )
);

  // To sync priorities from PriorityConfigurator, you can pass a setter:
  function handlePrioritiesChange(newPriorities: Record<string, number>) {
    setPriorities(newPriorities);
  }

  const activeErrors: ValidationError[] =
    activeEntity === "clients"
      ? errors.clients
      : activeEntity === "workers"
      ? errors.workers
      : errors.tasks;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header
        clients={clients}
        workers={workers}
        tasks={tasks}
        rules={rules}
        priorities={priorities}
      />
      <main className="flex-1 flex flex-row gap-8 w-full mx-auto mt-5">
        <Sidebar
          rules={rules}
          onAddRule={handleAddRule}
          onDeleteRule={handleDeleteRule}
          taskIDs={tasks.map((t) => t.TaskID)}
          clientGroups={clientGroups}
          workerGroups={workerGroups}
          priorities={priorities}
          handleFileParsed={handleFileParsed}
          handlePrioritiesChange={handlePrioritiesChange}
        />
        <MainPanel
          activeEntity={activeEntity}
          setActiveEntity={setActiveEntity}
          clients={clients}
          workers={workers}
          tasks={tasks}
          filteredClients={filteredClients}
          filteredWorkers={filteredWorkers}
          filteredTasks={filteredTasks}
          clientColumns={clientColumns}
          workerColumns={workerColumns}
          taskColumns={taskColumns}
          handleCellEdit={handleCellEdit}
          cellErrors={cellErrors}
          rules={rules}
          handleAddRule={handleAddRule}
          handleDeleteRule={handleDeleteRule}
          clientGroups={clientGroups}
          workerGroups={workerGroups}
          handleNLSearch={handleNLSearch}
          setFilteredClients={setFilteredClients}
          setFilteredWorkers={setFilteredWorkers}
          setFilteredTasks={setFilteredTasks}
          priorities={priorities}
          handlePrioritiesChange={handlePrioritiesChange}
        />
        {/* Validation Panel (right) */}
        <div className="w-[350px] sticky top-15 h-fit shrink-0">
          <ValidationPanel
            errors={activeErrors}
            data={
              activeEntity === "clients"
                ? clients
                : activeEntity === "workers"
                ? workers
                : tasks
            }
            onApplyFix={(
            rowId: string,
            field: string,
            newValue: any
          ) => {
            if (activeEntity === "clients") {
              const idField = "ClientID";
              const idx = clients.findIndex((row) => row[idField] === rowId);
              if (idx !== -1) {
                const updated = [...clients];
                updated[idx] = { ...updated[idx], [field]: newValue };
                setClients(updated);
                setErrors((prev) => ({
                  ...prev,
                  clients: validateClients(updated),
                }));
                console.log("Applied fix:", {
                  rowId,
                  field,
                  newValue,
                  updatedRow: updated[idx],
                });
              } else {
                console.warn("Row not found for fix:", { rowId, field, newValue });
              }
            } else if (activeEntity === "workers") {
              const idField = "WorkerID";
              const idx = workers.findIndex((row) => row[idField] === rowId);
              if (idx !== -1) {
                const updated = [...workers];
                updated[idx] = { ...updated[idx], [field]: newValue };
                setWorkers(updated);
                setErrors((prev) => ({
                  ...prev,
                  workers: validateWorkers(updated),
                }));
                console.log("Applied fix:", {
                  rowId,
                  field,
                  newValue,
                  updatedRow: updated[idx],
                });
              } else {
                console.warn("Row not found for fix:", { rowId, field, newValue });
              }
            } else if (activeEntity === "tasks") {
              const idField = "TaskID";
              const idx = tasks.findIndex((row) => row[idField] === rowId);
              if (idx !== -1) {
                const updated = [...tasks];
                updated[idx] = { ...updated[idx], [field]: newValue };
                setTasks(updated);
                setErrors((prev) => ({
                  ...prev,
                  tasks: validateTasks(updated),
                }));
                console.log("Applied fix:", {
                  rowId,
                  field,
                  newValue,
                  updatedRow: updated[idx],
                });
              } else {
                console.warn("Row not found for fix:", { rowId, field, newValue });
              }
            }
          }}
          />
        </div>
      </main>
    </div>
  );
}
