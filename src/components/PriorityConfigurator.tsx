"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

const CRITERIA = [
  { key: "PriorityLevel", label: "Priority Level" },
  { key: "RequestedTaskFulfillment", label: "Requested Task Fulfillment" },
  { key: "Fairness", label: "Fairness" },
  { key: "Workload", label: "Workload" },
];

const PRESETS = [
  {
    name: "Maximize Fulfillment",
    values: {
      PriorityLevel: 5,
      RequestedTaskFulfillment: 10,
      Fairness: 5,
      Workload: 5,
    },
  },
  {
    name: "Fair Distribution",
    values: {
      PriorityLevel: 5,
      RequestedTaskFulfillment: 5,
      Fairness: 10,
      Workload: 5,
    },
  },
  {
    name: "Minimize Workload",
    values: {
      PriorityLevel: 5,
      RequestedTaskFulfillment: 5,
      Fairness: 5,
      Workload: 10,
    },
  },
];

export default function PriorityConfigurator() {
  const [weights, setWeights] = useState<Record<string, number>>({
    PriorityLevel: 5,
    RequestedTaskFulfillment: 5,
    Fairness: 5,
    Workload: 5,
  });

  const handleSlider = (key: string, value: number[]) => {
    setWeights((prev) => ({ ...prev, [key]: value[0] }));
  };

  const applyPreset = (preset: typeof PRESETS[number]) => {
    setWeights(preset.values);
  };

  return (
    <Card className="max-w-xl w-full">
      <CardHeader>
        <CardTitle>Priority Configurator</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          {CRITERIA.map((c) => (
            <div key={c.key} className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <Label>{c.label}</Label>
                <span className="text-sm text-muted-foreground">{weights[c.key]}</span>
              </div>
              <Slider
                min={0}
                max={10}
                step={1}
                value={[weights[c.key]]}
                onValueChange={(val) => handleSlider(c.key, val)}
              />
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          {PRESETS.map((preset) => (
            <Button
              key={preset.name}
              variant="outline"
              onClick={() => applyPreset(preset)}
              type="button"
            >
              {preset.name}
            </Button>
          ))}
        </div>
        <div>
          <Label className="mb-1">JSON Preview</Label>
          <pre className="bg-muted rounded p-2 text-xs mt-1">
            {JSON.stringify(weights, null, 2)}
          </pre>
        </div>
      </CardContent>
       </Card>
  );
}