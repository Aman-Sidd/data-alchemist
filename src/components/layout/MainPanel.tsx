// components/layout/MainPanel.tsx
import NaturalSearch from "@/components/NaturalSearch";
import DataGrid from "@/components/DataGrid";
import type { Client, Worker, Task } from "@/types";
import type { RuleType } from "@/components/RuleBuilder";

type EntityType = "clients" | "workers" | "tasks";

interface Column {
  accessorKey: string;
  header: string;
}

interface MainPanelProps {
  activeEntity: EntityType;
  setActiveEntity: (entity: EntityType) => void;
  clients: Client[];
  workers: Worker[];
  tasks: Task[];
  filteredClients: Client[] | null;
  filteredWorkers: Worker[] | null;
  filteredTasks: Task[] | null;
  clientColumns: Column[];
  workerColumns: Column[];
  taskColumns: Column[];
  handleCellEdit: (rowIndex: number, columnId: string, newValue: any) => void;
  cellErrors: {
    rowIndex: number;
    columnId: string;
    message: string;
  }[];
  rules: RuleType[];
  handleAddRule: (rule: RuleType) => void;
  handleDeleteRule: (index: number) => void;
  clientGroups: string[];
  workerGroups: string[];
  handleNLSearch: () => Promise<void>;
  setFilteredClients: (data: Client[] | null) => void;
  setFilteredWorkers: (data: Worker[] | null) => void;
  setFilteredTasks: (data: Task[] | null) => void;
  priorities: Record<string, number>;
  handlePrioritiesChange: (weights: Record<string, number>) => void;
}

export default function MainPanel({
  activeEntity,
  setActiveEntity,
  clients,
  workers,
  tasks,
  filteredClients,
  filteredWorkers,
  filteredTasks,
  clientColumns,
  workerColumns,
  taskColumns,
  handleCellEdit,
  cellErrors,
  rules,
  handleAddRule,
  handleDeleteRule,
  clientGroups,
  workerGroups,
  handleNLSearch,
  setFilteredClients,
  setFilteredWorkers,
  setFilteredTasks,
  priorities,
  handlePrioritiesChange,
}: MainPanelProps) {
  return (
    <div className="flex-1 flex flex-col gap-8">
      {/* Entities Selector */}
      <div className="flex justify-center mb-2">
        <div className="flex gap-2">
          {(["clients", "workers", "tasks"] as EntityType[]).map((entity) => (
            <button
              key={entity}
              className={`px-4 py-1 rounded font-medium transition ${
                activeEntity === entity
                  ? "bg-primary text-white"
                  : "bg-muted hover:bg-accent"
              }`}
              onClick={() => setActiveEntity(entity)}
            >
              {entity.charAt(0).toUpperCase() + entity.slice(1)}
            </button>
          ))}
        </div>
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
      {/* DataGrid */}
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
    </div>
  );
}