"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { ColumnDef } from "@tanstack/react-table";

type NaturalSearchProps = {
  entityType: "clients" | "workers" | "tasks";
  data: any[];
  columns: ColumnDef<any, any>[];
  onFiltered: (results: any[]) => void;
};

export default function NaturalSearch({
  entityType,
  data,
  columns,
  onFiltered,
}: NaturalSearchProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/nl-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType, query, data }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      onFiltered(json.result);
    } catch (e: any) {
      setError(e.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setQuery("");
    setError(null);
    onFiltered(data);
  }

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex gap-2 items-center">
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={`Natural language search (${entityType})`}
          className="flex-1"
          onKeyDown={e => {
            if (e.key === "Enter") handleSearch();
          }}
          disabled={loading}
        />
        <Button onClick={handleSearch} disabled={loading || !query}>
          {loading ? "Searching..." : "Search"}
        </Button>
        <Button variant="outline" onClick={handleReset} disabled={loading}>
          Reset
        </Button>
      </div>
      {error && <div className="text-red-600">{error}</div>}
    </div>
  );
}