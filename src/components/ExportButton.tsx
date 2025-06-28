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
}

export default function ExportButton({
  clients,
  workers,
  tasks,
  rules,
  priorities,
}: ExportButtonProps) {
  const handleExport = () => {
    try {
      // (Optional) Add validation here if needed
      exportAllData({ clients, workers, tasks, rules, priorities });
      toast.success("Export started! Your files are downloading.");
    } catch (e: any) {
      toast.error("Export failed: " + (e?.message || "Unknown error"));
    }
  };

  return (
    <Button onClick={handleExport}>
      📦 Export Cleaned Data + Rules
    </Button>
    );
}