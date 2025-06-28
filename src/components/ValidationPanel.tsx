"use client";

import React from "react";
import { ValidationError } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

type ValidationPanelProps = {
  errors: ValidationError[];
  onErrorClick?: (entity: string, rowId: string) => void; // Optional callback for scrolling
};

const entityLabels: Record<string, string> = {
  client: "Clients",
  worker: "Workers",
  task: "Tasks",
};

export const ValidationPanel: React.FC<ValidationPanelProps> = ({
  errors,
  onErrorClick,
}) => {
  // Group errors by entity
  const grouped = errors.reduce<Record<string, ValidationError[]>>((acc, err) => {
    acc[err.entity] = acc[err.entity] || [];
    acc[err.entity].push(err);
    return acc;
  }, {});

  return (
    <Card className="w-full max-w-md">
      <CardContent className="p-4">
        <h2 className="font-semibold text-lg mb-2">Validation Issues</h2>
        {errors.length === 0 ? (
          <div className="text-green-600">No errors 🎉</div>
        ) : (
          <ScrollArea className="max-h-72 overflow-y-auto border rounded">
            <div className="pr-2">
              {Object.entries(grouped).map(([entity, entityErrors]) => (
                <div key={entity} className="mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{entityLabels[entity] || entity}</span>
                    <Badge variant="destructive">{entityErrors.length}</Badge>
                  </div>
                  <ul className="pl-3 space-y-1">
                    {entityErrors.map((err, i) => (
                      <li
                        key={i}
                        className="text-sm text-destructive cursor-pointer hover:underline"
                        onClick={() =>
                          onErrorClick?.(entity, err.rowId)
                        }
                      >
                        Row: <span className="font-mono">{err.rowId || "?"}</span>, <b>{err.field}</b>: {err.message}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default ValidationPanel;