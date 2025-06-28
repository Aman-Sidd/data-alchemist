"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Command, CommandInput, CommandItem, CommandList } from "./ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Checkbox } from "./ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { parseNaturalLanguageRule } from "@/ai/nlToRule";
import { nlpSuggestRules } from "@/ai/nlpSuggestRules";
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export type RuleType =
  | "coRun"
  | "slotRestriction"
  | "loadLimit"
  | "phaseWindow"
  | "regexMatch";

interface RuleBuilderProps {
  taskIDs: string[];
  clientGroups: string[];
  workerGroups: string[];
  onAddRule: (rule: any) => void;
}

const ruleTypes: { value: RuleType; label: string }[] = [
  { value: "coRun", label: "Co-Run" },
  { value: "slotRestriction", label: "Slot Restriction" },
  { value: "loadLimit", label: "Load Limit" },
  { value: "phaseWindow", label: "Phase Window" },
  { value: "regexMatch", label: "Regex Match" },
];

const regexTemplates = [
  { value: "startsWith", label: "Starts With" },
  { value: "endsWith", label: "Ends With" },
  { value: "contains", label: "Contains" },
  { value: "custom", label: "Custom Regex" },
];

export default function RuleBuilder({
  taskIDs,
  clientGroups,
  workerGroups,
  onAddRule,
}: RuleBuilderProps) {
  const [ruleType, setRuleType] = useState<RuleType | "">("");
  const [selectedTaskIDs, setSelectedTaskIDs] = useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [minCommonSlots, setMinCommonSlots] = useState<string>("");
  const [maxSlotsPerPhase, setMaxSlotsPerPhase] = useState<string>("");
  const [selectedWorkerGroup, setSelectedWorkerGroup] = useState<string>("");
  const [phaseTaskID, setPhaseTaskID] = useState<string>("");
  const [allowedPhases, setAllowedPhases] = useState<string>("");
  const [regex, setRegex] = useState<string>("");
  const [regexTemplate, setRegexTemplate] = useState<string>("");
  const [regexParams, setRegexParams] = useState<string>("");

  // For NL rule input
  const [nlInput, setNlInput] = useState("");
  const [nlLoading, setNlLoading] = useState(false);

  // For AI suggestions
  const [suggestedRules, setSuggestedRules] = useState<any[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);

  function resetForm() {
    setRuleType("");
    setSelectedTaskIDs([]);
    setSelectedGroup("");
    setMinCommonSlots("");
    setMaxSlotsPerPhase("");
    setSelectedWorkerGroup("");
    setPhaseTaskID("");
    setAllowedPhases("");
    setRegex("");
    setRegexTemplate("");
    setRegexParams("");
  }

  function handleAddRule() {
    let rule: any = { type: ruleType };
    if (ruleType === "coRun") {
      rule.taskIDs = selectedTaskIDs;
    } else if (ruleType === "slotRestriction") {
      rule.group = selectedGroup;
      rule.minCommonSlots = Number(minCommonSlots);
    } else if (ruleType === "loadLimit") {
      rule.workerGroup = selectedWorkerGroup;
      rule.maxSlotsPerPhase = Number(maxSlotsPerPhase);
    } else if (ruleType === "phaseWindow") {
      rule.taskID = phaseTaskID;
      rule.allowedPhases = allowedPhases.split(",").map(s => s.trim()).filter(Boolean);
    } else if (ruleType === "regexMatch") {
      rule.regex = regex;
      rule.template = regexTemplate;
      rule.params = regexParams;
    }
    onAddRule(rule);
    resetForm();
  }

  // --- Natural Language Rule Handler ---
  async function handleNLSubmit() {
    if (!nlInput.trim()) return;
    setNlLoading(true);
    try {
      const contextData = { taskIDs, clientGroups, workerGroups };
      const rule = await parseNaturalLanguageRule(nlInput, contextData);
      if (rule && rule.type) {
        onAddRule(rule);
        toast.success("Rule parsed and added!");
        setNlInput("");
      } else {
        toast.error("Could not parse rule. Please try again.");
      }
    } catch (e: any) {
      toast.error("Failed to parse rule: " + (e?.message || "Unknown error"));
    } finally {
      setNlLoading(false);
    }
  }

  // --- AI Suggest Rules Handler ---
  async function handleSuggestRules() {
    setSuggestLoading(true);
    try {
      const suggestions = await nlpSuggestRules(clientGroups, taskIDs, workerGroups);
      setSuggestedRules(suggestions);
      if (!suggestions.length) {
        toast("No suggestions found.");
      }
    } catch (e: any) {
      toast.error("Failed to get suggestions: " + (e?.message || "Unknown error"));
    } finally {
      setSuggestLoading(false);
    }
  }

  function handleAcceptSuggestion(rule: any) {
    onAddRule(rule);
    toast.success("Rule added!");
    setSuggestedRules(suggestedRules.filter(r => r !== rule));
  }

  function handleRejectSuggestion(rule: any) {
    setSuggestedRules(suggestedRules.filter(r => r !== rule));
  }

  return (
    <Card className="max-w-xl w-full">
      <CardHeader>
        <CardTitle>Add New Rule</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {/* NL Rule Input */}
          <div>
            <Label>Natural Language Rule</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={nlInput}
                onChange={e => setNlInput(e.target.value)}
                placeholder="e.g. Only GroupA can run Task T1 in phase 2"
                disabled={nlLoading}
              />
              <Button onClick={handleNLSubmit} disabled={nlLoading || !nlInput.trim()}>
                {nlLoading ? "Parsing..." : "Parse"}
              </Button>
            </div>
          </div>

          {/* Suggest Rules Button */}
          <div>
            <Button onClick={handleSuggestRules} disabled={suggestLoading}>
              {suggestLoading ? "Suggesting..." : "Suggest Rules"}
            </Button>
          </div>

          {/* Suggestions Display */}
          {suggestedRules.length > 0 && (
            <Accordion type="multiple" className="mb-4">
  {suggestedRules.map((rule, idx) => {
    // Remove 'reason' from the previewed JSON
    const { reason, ...ruleWithoutReason } = rule;
    return (
      <AccordionItem key={idx} value={`suggestion-${idx}`}>
        <AccordionTrigger>
          <span>
            🧠 {rule.reason ? rule.reason : "AI Suggested Rule"}
          </span>
        </AccordionTrigger>
        <AccordionContent>
          <pre className="bg-muted p-2 rounded text-xs overflow-x-auto mb-2">
            {JSON.stringify(ruleWithoutReason, null, 2)}
          </pre>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => handleAcceptSuggestion(ruleWithoutReason)}
            >
              ✅ Add to Rule Config
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleRejectSuggestion(rule)}
            >
              ❌ Reject
            </Button>
          </div>
        </AccordionContent>
      </AccordionItem>
    );
  })}
</Accordion>
          )}

          <div>
            <Label>Rule Type</Label>
            <Select value={ruleType} onValueChange={v => setRuleType(v as RuleType)}>
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Select rule type" />
              </SelectTrigger>
              <SelectContent>
                {ruleTypes.map(rt => (
                  <SelectItem key={rt.value} value={rt.value}>{rt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dynamic Fields */}
          {ruleType === "coRun" && (
            <div>
              <Label>Task IDs</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                  >
                    {selectedTaskIDs.length > 0
                      ? selectedTaskIDs.join(", ")
                      : "Select Task IDs"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Search Task IDs..." />
                    <CommandList>
                      {taskIDs.map((id) => (
                        <CommandItem
                          key={id}
                          onSelect={() => {
                            setSelectedTaskIDs((prev) =>
                              prev.includes(id)
                                ? prev.filter((tid) => tid !== id)
                                : [...prev, id]
                            );
                          }}
                        >
                          <Checkbox
                            checked={selectedTaskIDs.includes(id)}
                            className="mr-2"
                            tabIndex={-1}
                            aria-hidden="true"
                            onCheckedChange={() => {
                              setSelectedTaskIDs((prev) =>
                                prev.includes(id)
                                  ? prev.filter((tid) => tid !== id)
                                  : [...prev, id]
                              );
                            }}
                          />
                          {id}
                        </CommandItem>
                      ))}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          )}

          {ruleType === "slotRestriction" && (
            <div className="flex gap-2">
              <div className="flex-1">
                <Label>Group</Label>
                <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="Select group" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(new Set([...clientGroups, ...workerGroups])).map(g => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label>Min Common Slots</Label>
                <Input
                  type="number"
                  value={minCommonSlots}
                  onChange={e => setMinCommonSlots(e.target.value)}
                  placeholder="e.g. 2"
                  min={1}
                />
              </div>
            </div>
          )}

          {ruleType === "loadLimit" && (
            <div className="flex gap-2">
              <div className="flex-1">
                <Label>Worker Group</Label>
                <Select value={selectedWorkerGroup} onValueChange={setSelectedWorkerGroup}>
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="Select worker group" />
                  </SelectTrigger>
                  <SelectContent>
                    {workerGroups.map(g => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label>Max Slots Per Phase</Label>
                <Input
                  type="number"
                  value={maxSlotsPerPhase}
                  onChange={e => setMaxSlotsPerPhase(e.target.value)}
                  placeholder="e.g. 3"
                  min={1}
                />
              </div>
            </div>
          )}

          {ruleType === "phaseWindow" && (
            <div className="flex gap-2">
              <div className="flex-1">
                <Label>Task ID</Label>
                <Select value={phaseTaskID} onValueChange={setPhaseTaskID}>
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="Select Task ID" />
                  </SelectTrigger>
                  <SelectContent>
                    {taskIDs.map(id => (
                      <SelectItem key={id} value={id}>{id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label>Allowed Phases (comma separated)</Label>
                <Input
                  value={allowedPhases}
                  onChange={e => setAllowedPhases(e.target.value)}
                  placeholder="e.g. 1,2,3"
                />
              </div>
            </div>
          )}

          {ruleType === "regexMatch" && (
            <div className="flex flex-col gap-2">
              <div>
                <Label>Regex</Label>
                <Input
                  value={regex}
                  onChange={e => setRegex(e.target.value)}
                  placeholder="e.g. ^T[0-9]+$"
                />
              </div>
              <div>
                <Label>Template</Label>
                <Select value={regexTemplate} onValueChange={setRegexTemplate}>
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {regexTemplates.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Optional Parameters</Label>
                <Input
                  value={regexParams}
                  onChange={e => setRegexParams(e.target.value)}
                  placeholder="Parameters (optional)"
                />
              </div>
            </div>
          )}

          <Button
            className="mt-2"
            onClick={handleAddRule}
            disabled={!ruleType ||
              (ruleType === "coRun" && selectedTaskIDs.length === 0) ||
              (ruleType === "slotRestriction" && (!selectedGroup || !minCommonSlots)) ||
              (ruleType === "loadLimit" && (!selectedWorkerGroup || !maxSlotsPerPhase)) ||
              (ruleType === "phaseWindow" && (!phaseTaskID || !allowedPhases)) ||
              (ruleType === "regexMatch" && (!regex || !regexTemplate))
            }
          >
            Add Rule
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}