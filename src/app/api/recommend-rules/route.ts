import { NextRequest } from "next/server";
import OpenAI from "openai";

export const runtime = "edge";

function flattenRule(rule: any) {
  if (rule && typeof rule === "object" && rule.params && typeof rule.params === "object") {
    // Move all params fields to the root, keep other fields (like type, reason)
    const { params, ...rest } = rule;
    return { ...rest, ...params };
  }
  return rule;
}

export async function POST(req: NextRequest) {
  const { clients, tasks, workers } = await req.json();

  const apiKey = process.env.OPENROUTER_API_KEY || "";
  if (!apiKey) {
    return Response.json({ error: "Missing API Key" }, { status: 500 });
  }

  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
    defaultHeaders: {
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL,
      "X-Title": "Data Alchemist",
      "X-Description": "AI rule suggestions from data patterns",
    },
  });

 const prompt = `
You are a helpful assistant for a resource allocation AI tool.

Based on the JSON data provided for clients, tasks, and workers,
analyze and suggest up to 5 useful resource-allocation rules.

Each rule must follow this JSON format (do NOT use a "params" object):

// coRun example:
{ "type": "coRun", "taskIDs": ["T1", "T2"], "reason": "short explanation" }
// slotRestriction example:
{ "type": "slotRestriction", "group": "G1", "minCommonSlots": 2, "reason": "..." }
// loadLimit example:
{ "type": "loadLimit", "workerGroup": "G2", "maxSlotsPerPhase": 3, "reason": "..." }
// phaseWindow example:
{ "type": "phaseWindow", "taskID": "T4", "allowedPhases": [1,2], "reason": "..." }
// patternMatch example:
{ "type": "patternMatch", "regex": ".*", "applyTo": "taskName", "reason": "..." }

ONLY return a single JSON array of suggestions. No markdown. No extra explanation.
`;

  const response = await openai.chat.completions.create({
    model: "deepseek/deepseek-r1-0528:free",
    messages: [
      { role: "system", content: prompt },
      {
        role: "user",
        content: `Clients:\n${JSON.stringify(clients)}\n\nTasks:\n${JSON.stringify(
          tasks
        )}\n\nWorkers:\n${JSON.stringify(workers)}`,
      },
    ],
  });

  const output = response.choices?.[0]?.message?.content || "";
  console.log("Model output:", output);

  const match = output.match(/\[.*\]/s);
  if (!match) {
    return Response.json({ error: "No valid JSON array returned" }, { status: 500 });
  }

  try {
    let suggestions = JSON.parse(match[0]);
    if (Array.isArray(suggestions)) {
      suggestions = suggestions.map(flattenRule);
    }
    return Response.json({ suggestions });
  } catch (e) {
    console.error("JSON parse error:", e);
    return Response.json({ error: "Failed to parse rule suggestions." }, { status: 500 });
  }
}