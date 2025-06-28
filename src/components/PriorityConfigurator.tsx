"use client";

import { useState, useEffect } from "react";
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

export default function PriorityConfigurator({
	onChange,
	priorities,
}: {
	onChange?: (weights: Record<string, number>) => void;
	priorities?: Record<string, number>;
}) {
	const [weights, setWeights] = useState<Record<string, number>>({
		PriorityLevel: 5,
		RequestedTaskFulfillment: 5,
		Fairness: 5,
		Workload: 5,
	});

	// Sync with parent state if priorities prop changes
	useEffect(() => {
		if (priorities) setWeights(priorities);
	}, [priorities]);

	const handleSlider = (key: string, value: number[]) => {
		const newWeights = { ...weights, [key]: value[0] };
		setWeights(newWeights);
		onChange?.(newWeights);
	};

	const applyPreset = (preset: typeof PRESETS[number]) => {
		setWeights(preset.values);
		onChange?.(preset.values);
	};

	return (
		<Card className="w-full bg-muted border-none shadow-none p-2">
			<CardHeader className="p-2 pb-1">
				<CardTitle className="text-base font-semibold">Priorities</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col gap-4 p-2">
				<div className="flex flex-col gap-2">
					{CRITERIA.map((c) => (
						<div key={c.key} className="flex flex-col gap-1">
							<div className="flex justify-between items-center">
								<Label className="text-xs">{c.label}</Label>
								<span className="text-xs text-muted-foreground">
									{weights[c.key]}
								</span>
							</div>
							<Slider
								min={0}
								max={10}
								step={1}
								value={[weights[c.key]]}
								onValueChange={(val) => handleSlider(c.key, val)}
								className="h-2"
							/>
						</div>
					))}
				</div>
				<div className="flex gap-1 flex-wrap">
					{PRESETS.map((preset) => (
						<Button
							key={preset.name}
							variant="outline"
							size="sm"
							className="text-xs px-2 py-1"
							onClick={() => applyPreset(preset)}
							type="button"
						>
							{preset.name}
						</Button>
					))}
				</div>
				<div>
					<Label className="mb-1 text-xs">JSON</Label>
					<pre className="bg-background rounded p-1 text-[10px] mt-1 overflow-x-auto">
						{JSON.stringify(weights, null, 2)}
					</pre>
				</div>
			</CardContent>
		</Card>
	);
}