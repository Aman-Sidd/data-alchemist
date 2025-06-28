import { NextRequest } from "next/server";
import OpenAI from "openai";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const { error, rowData, context } = await req.json();

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
        "X-Description": "Suggest fix for data validation error",
      },
    });

    const prompt = "You are a helpful data fixer. Given the following validation error and the row of data it occurs in, suggest a minimal fix. Output only valid JSON like:\n\n{ \"suggestion\": \"Fix description\", \"newValue\": 5 }\n\nNo explanations, no markdown, no code fences."
;

    const response = await openai.chat.completions.create({
      model: "deepseek/deepseek-chat-v3-0324:free",
      temperature: 0.2,
      messages: [
        { role: "system", content: prompt.trim() },
        {
          role: "user",
          content: `Error:\n${JSON.stringify(error)}\nRow Data:\n${JSON.stringify(rowData)}\nContext:\n${JSON.stringify(context)}`,
        },
      ],
    });

    const output = response.choices?.[0]?.message?.content || "";
    const match = output.match(/\{[\s\S]*\}/);
    if (!match) {
      return Response.json({ error: "No valid JSON object returned" }, { status: 500 });
    }

    try {
      const suggestionObj = JSON.parse(match[0]);
      return Response.json(suggestionObj);
    } catch (e) {
      console.error("JSON parse error:", e);
      return Response.json({ error: "Failed to parse suggestion." }, { status: 500 });
    }
  } catch (e) {
    console.error("Suggest fix failed:", e);
    return Response.json({ error: "Failed to suggest fix." }, { status: 500 });
  }
}