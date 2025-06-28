"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ExportRulesButtonProps {
  rules: any[];
}

export default function ExportRulesButton({ rules }: ExportRulesButtonProps) {
  const handleExport = () => {
    const json = JSON.stringify(rules, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "rules.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    toast.success("Your rules.json file is downloading.");
  };

  return (
    <Button onClick={handleExport}>
      Export Rules JSON
    </Button>
  );
}