// components/layout/Sidebar.tsx
import { useState } from "react";
import FileUploader from "@/components/FileUploader";
import PriorityConfigurator from "@/components/PriorityConfigurator";
import RuleBuilder, { RuleType } from "@/components/RuleBuilder";
import RuleList from "@/components/RuleList";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Client, EntityType, Task } from "@/types";

interface SidebarProps {
  rules: RuleType[];
  onAddRule: (rule: RuleType) => void;
  onDeleteRule: (index: number) => void;
  taskIDs: string[];
  clientGroups: string[];
  workerGroups: string[];
  priorities: Record<string, number>;
  handleFileParsed: (entityType: EntityType, parsedData: any) => void;
  handlePrioritiesChange: (weights: Record<string, number>) => void;
}

export default function Sidebar({
  rules,
  onAddRule,
  onDeleteRule,
  taskIDs,
  clientGroups,
  workerGroups,
  priorities,
  handleFileParsed,
  handlePrioritiesChange,
}: SidebarProps) {
  const [open, setOpen] = useState(false);

  // Disable Add Rule if no files (no clients, workers, or tasks loaded)
  const noFilesPresent =
    taskIDs.length === 0 &&
    clientGroups.length === 0 &&
    workerGroups.length === 0;

  return (
    <aside className="w-72 flex flex-col gap-4 shrink-0 bg-card border-r p-4">
      <FileUploader onFileParsed={handleFileParsed} />

      {/* Add Rule Button */}
      <Button
        className="w-full"
        onClick={() => setOpen(true)}
        disabled={noFilesPresent}
      >
        + Add Rule
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Rule</DialogTitle>
          </DialogHeader>
          <RuleBuilder
            taskIDs={taskIDs}
            clientGroups={clientGroups}
            workerGroups={workerGroups}
            onAddRule={(rule) => {
              onAddRule(rule);
              setOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Current Rules */}
      <div>
        <div className="flex-1 overflow-auto">
          <div className="font-semibold text-sm mb-2">Current Rules</div>
          <RuleList rules={rules} onDelete={onDeleteRule} />
        </div>

        {/* Priority Configurator */}
        <div className="mt-4">
          <PriorityConfigurator
            onChange={handlePrioritiesChange}
            priorities={priorities}
          />
        </div>
      </div>
    </aside>
  );
}