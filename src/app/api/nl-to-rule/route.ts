import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "edge";

const apiKey = process.env.OPENROUTER_API_KEY || "";
const baseURL = "https://openrouter.ai/api/v1";

const openai = new OpenAI({
  baseURL,
  apiKey,
  defaultHeaders: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL,
    "X-Title": "Data Alchemist",
    "X-Description": "Natural language rule converter for resource allocation",
  },
});

export async function POST(req: Request) {
  try {
    const { input, contextData } = await req.json();

    const response = await openai.chat.completions.create({
      model: "deepseek/deepseek-r1-0528:free",
      messages: [
        {
          role: "system",
          content: `
You are a JSON generator for resource-allocation rules.

Your job is to convert natural language into a JSON object like:
{"type": "...", "fields...": ...}

✱ OUTPUT RULES:
- Output only one line of raw valid JSON.
- Do NOT use markdown, explanation, comments, or extra text.
- Do NOT include \`\`\` anywhere.
- If unsure, return: {}

✱ RULE TYPES:
- coRun: { "type": "coRun", "tasks": ["T1", "T2"] }
- slotRestriction: { "type": "slotRestriction", "group": "G1", "minCommonSlots": 2 }
- loadLimit: { "type": "loadLimit", "workerGroup": "G2", "maxSlotsPerPhase": 3 }
- phaseWindow: { "type": "phaseWindow", "taskID": "T4", "allowedPhases": [1,2] }
- patternMatch: { "type": "patternMatch", "regex": ".*", "applyTo": "taskName" }
- precedenceOverride: { "type": "precedenceOverride", "globalOrder": ["T1", "T2"] }

Only return raw JSON on one line. Never return text, explanation, or markdown.
          `.trim(),
        },
        {
          role: "user",
          content: `Context:\n${JSON.stringify(contextData)}\nInstruction:\n${input}`,
        },
      ],
    });

    const modelText = response.choices[0].message.content || "";
    console.log("Model response text:", modelText);

    const finishReason = response.choices[0].finish_reason;
    if (finishReason !== "stop") {
      console.warn("⚠️ Model response may be truncated:", finishReason);
    }

    // Extract best possible JSON from modelText
    const jsonStart = modelText.indexOf("{");
    const jsonEnd = modelText.lastIndexOf("}");
    let rule = {};

    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      const jsonStr = modelText.slice(jsonStart, jsonEnd + 1);
      try {
        rule = JSON.parse(jsonStr);
      } catch (err) {
        console.error("❌ Failed to parse JSON:", err, "\nRaw text:", jsonStr);
        return NextResponse.json({ error: "Model returned invalid JSON." }, { status: 500 });
      }
    } else {
      console.error("❌ No complete JSON found in model response:", modelText);
      return NextResponse.json({ error: "No valid JSON found." }, { status: 500 });
    }

    return NextResponse.json(rule);
  } catch (e) {
    console.error("❌ Rule parsing failed:", e);
    return NextResponse.json({ error: "Failed to parse rule." }, { status: 500 });
  }
}
