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

    const prompt = `
You are a JSON-generating AI assistant embedded in a data validation system for a resource allocation tool called "Data Alchemist".

Your task is to suggest **safe, minimal fixes** to validation errors in a user's uploaded data.

---

🔧 OUTPUT FORMAT:
Always respond with **valid JSON only**, like:

{
  "suggestion": "Fix description here",
  "newValue": VALID_TYPED_VALUE
}

Do NOT include any extra explanation, markdown, or code fences.

---

🎯 RULES:
1. Your fix must match the field's expected **data type**. Refer to the schema below.
2. Use the existing row data and context to infer the most likely correct value.
3. For arrays, always return a real **JSON array** (not a string like "1,2").
4. Avoid over-fixing — suggest **minimal and reasonable** changes.

---

📦 SCHEMA (Field Types):
- Client.PriorityLevel → integer (1–5)
- Client.RequestedTaskIDs → array of task IDs (e.g. ["T1", "T3"])
- Worker.AvailableSlots → array of integers (e.g. [1, 3, 5])
- Worker.Skills → array of strings (e.g. ["java", "sql"])
- Worker.MaxLoadPerPhase → integer
- Task.Duration → integer (>= 1)
- Task.RequiredSkills → array of strings
- Task.PreferredPhases → array of integers (e.g. [2,4,5]) or range (e.g. [1,2,3])
- Any GroupTag/WorkerGroup → non-empty string

---

💡 EXAMPLES:

Bad: Worker.AvailableSlots is empty →  
✅ { "suggestion": "Set AvailableSlots to default [1,2]", "newValue": [1, 2] }

Bad: Task.Duration is zero →  
✅ { "suggestion": "Set Duration to minimum 1", "newValue": 1 }

Bad: PriorityLevel is 'high' →  
✅ { "suggestion": "Set PriorityLevel to valid number", "newValue": 3 }

---

Now generate a fix for the following:
`;



    const response = await openai.chat.completions.create({
      model: "deepseek/deepseek-chat-v3-0324:free",
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
      console.log("Suggestion object:", suggestionObj);
      // Only for AvailableSlots and PreferredPhases, ensure array format if value is a string like "2,3"
      const arrayFields = ["AvailableSlots", "PreferredPhases"];
      if (
        suggestionObj &&
        typeof suggestionObj.newValue === "string" &&
        error &&
        arrayFields.includes(error.field)
      ) {
        // Accept range for PreferredPhases (e.g. "1-3")
        if (
          error.field === "PreferredPhases" &&
          /^\d+\s*-\s*\d+$/.test(suggestionObj.newValue.trim())
        ) {
          // Keep as string (range)
        } else {
          // Convert "2,3" or similar to [2,3]
          const arr = suggestionObj.newValue
            .split(",")
            .map((v: string) => {
              const n = Number(v.trim());
              return isNaN(n) ? v.trim() : n;
            });
          suggestionObj.newValue = arr;
        }
      }
      console.log("Final suggestion object:", suggestionObj);
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