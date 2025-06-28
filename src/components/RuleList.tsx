"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export interface RuleListProps {
  rules: any[];
  onDelete: (index: number) => void;
}

export default function RuleList({ rules, onDelete }: RuleListProps) {
  return (
    <Card className="max-w-xl w-full">
      <CardHeader>
        <CardTitle>Current Rules</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {rules.length === 0 && (
            <div className="text-muted-foreground text-center">No rules added yet.</div>
          )}
          {rules.map((rule, idx) => (
            <Card key={idx} className="relative">
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-2 right-2"
                onClick={() => onDelete(idx)}
                aria-label="Delete rule"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{rule.type}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <pre className="text-xs whitespace-pre-wrap break-all">
                  {JSON.stringify(rule, null, 2)}
                </pre>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
      </Card>
  );
}