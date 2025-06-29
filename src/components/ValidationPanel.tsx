"use client";

import React, { useState } from "react";
import { ValidationError } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Sparkles } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ValidationPanelProps = {
  errors: ValidationError[];
  data: any[];
  onErrorClick?: (entity: string, rowId: string) => void;
  onApplyFix?: (rowId: string, field: string, newValue: any) => void;
};

const entityLabels: Record<string, string> = {
  client: "Clients",
  worker: "Workers",
  task: "Tasks",
};

export const ValidationPanel: React.FC<ValidationPanelProps> = ({
  data,
  errors,
  onErrorClick,
  onApplyFix,
}) => {
  const [loadingIdx, setLoadingIdx] = useState<number | null>(null);
  const [dialog, setDialog] = useState<{
    open: boolean;
    suggestion?: string;
    newValue?: any;
    rowId?: string;
    field?: string;
  }>({ open: false });

  // If no file is selected (data is empty), always show "No errors"
  const noFileSelected = !data || data.length === 0;

  // Suggest Fix handler
  async function handleSuggestFix(error: ValidationError, idx: number) {
    setLoadingIdx(idx);
    try {
      const rowData =
        data.find(
          (row) =>
            row[
              `${error.entity.charAt(0).toUpperCase() + error.entity.slice(1)}ID`
            ] === error.rowId
        ) || {};
      const res = await fetch("/api/suggest-fix", {
        method: "POST",
        body: JSON.stringify({
          error,
          rowData,
          context: {},
        }),
        headers: { "Content-Type": "application/json" },
      });
      const result = await res.json();
      setDialog({
        open: true,
        suggestion: result.suggestion || "No suggestion available.",
        newValue: result.newValue,
        rowId: error.rowId,
        field: error.field,
      });
    } catch (e) {
      setDialog({
        open: true,
        suggestion: "Failed to get suggestion.",
      });
    } finally {
      setLoadingIdx(null);
    }
  }

  // Group errors by entity
  const grouped = errors.reduce<Record<string, ValidationError[]>>((acc, err) => {
    acc[err.entity] = acc[err.entity] || [];
    acc[err.entity].push(err);
    return acc;
  }, {});

  return (
    <Card className="h-[calc(100vh-6rem)] w-full max-w-xs min-w-[300px] border-l shadow-lg flex flex-col bg-card">
      <CardContent className="p-4 flex flex-col h-full">
        <h2 className="font-semibold text-base mb-2">Validation Issues</h2>
        {noFileSelected ? (
          <div className="text-green-600 text-sm">No errors 🎉</div>
        ) : errors.length === 0 ? (
          <div className="text-green-600 text-sm">No errors 🎉</div>
        ) : (
          <ScrollArea className="flex-1 max-h-[70vh] pr-1">
            <div>
              {Object.entries(grouped).map(([entity, entityErrors]) => (
                <div key={entity} className="mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-xs">
                      {entityLabels[entity] || entity}
                    </span>
                    <Badge variant="destructive">{entityErrors.length}</Badge>
                  </div>
                  <ul className="pl-3 space-y-1">
                    {entityErrors.map((err, i) => (
                      <li
                        key={i}
                        className="text-xs text-destructive flex items-center gap-2"
                      >
                        <span
                          onClick={() => onErrorClick?.(entity, err.rowId)}
                          style={{
                            cursor: onErrorClick ? "pointer" : undefined,
                          }}
                          className={onErrorClick ? "hover:underline" : ""}
                        >
                          Row:{" "}
                          <span className="font-mono">
                            {err.rowId || "?"}
                          </span>
                          , <b>{err.field}</b>: {err.message}
                        </span>
                        <TooltipProvider>
                          <Tooltip open={loadingIdx !== null ? false : undefined} disableHoverableContent={loadingIdx !== null}>
                            <TooltipTrigger asChild>
                              <span>
                                <Button
                                  size="icon"
                                  variant="secondary"
                                  onClick={() => handleSuggestFix(err, i)}
                                  disabled={loadingIdx !== null}
                                  aria-label="Suggest Fix"
                                >
                                  {loadingIdx === i ? (
                                    <span className="animate-pulse">...</span>
                                  ) : (
                                    <Sparkles className="w-4 h-4 text-primary" />
                                  )}
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <span>AI Suggest Fix</span>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
      <Dialog open={dialog.open} onOpenChange={(open) => setDialog({ ...dialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>AI Suggestion</DialogTitle>
          </DialogHeader>
          <div className="mb-2">
            <strong>Suggestion:</strong>
            <div className="mt-1">{dialog.suggestion}</div>
          </div>
          {dialog.newValue !== undefined && (
            <div className="mb-2">
              <strong>Suggested Value:</strong>
              <div className="mt-1 break-all">
                {Array.isArray(dialog.newValue)
                  ? JSON.stringify(dialog.newValue)
                  : String(dialog.newValue)}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setDialog({ open: false })} variant="outline">
              Reject
            </Button>
            {dialog.newValue !== undefined && typeof dialog.rowId === "string" && typeof dialog.field === "string" && (
              <Button
                onClick={() => {
                  onApplyFix?.(dialog.rowId as string, dialog.field as string, dialog.newValue);
                  setDialog({ open: false });
                }}
              >
                Accept
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ValidationPanel;