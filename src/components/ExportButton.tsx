"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { exportAllData } from "@/utils/exportData";

interface ExportButtonProps {
  clients: any[];
  workers: any[];
  tasks: any[];
  rules: any[];
  priorities: Record<string, number>;
  disabled?: boolean;
}

export default function ExportButton({
  clients,
  workers,
  tasks,
  rules,
  priorities,
  disabled
}: ExportButtonProps) {
  const isExportable =
    (clients && clients.length > 0) ||
    (workers && workers.length > 0) ||
    (tasks && tasks.length > 0) ||
    (rules && rules.length > 0) ||
    (priorities && Object.keys(priorities).length > 0);

  const handleExport = () => {
    try {
      exportAllData({ clients, workers, tasks, rules, priorities });
      toast.success("Export started! Your files are downloading.");
    } catch (e: any) {
      toast.error("Export failed: " + (e?.message || "Unknown error"));
    }
  };

  return (
    <Button disabled={!isExportable || disabled} onClick={handleExport}>
      📦 Export Cleaned Data + Rules
    </Button>
  );
}