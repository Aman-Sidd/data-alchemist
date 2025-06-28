import ExportButton from "@/components/ExportButton";
import type { Client, Worker, Task } from "@/types";
import type { RuleType } from "@/components/RuleBuilder";

interface HeaderProps {
  clients: Client[];
  workers: Worker[];
  tasks: Task[];
  rules: RuleType[];
  priorities: Record<string, number>;
}

export default function Header({ clients, workers, tasks, rules, priorities }: HeaderProps) {
  return (
    <header className="w-full border-b bg-card px-8 py-4 flex items-center justify-between">
      <span className="text-2xl font-bold tracking-tight">Data Alchemist</span>
      <ExportButton
        clients={clients}
        workers={workers}
        tasks={tasks}
        rules={rules}
        priorities={priorities}
      />
    </header>
  );
}