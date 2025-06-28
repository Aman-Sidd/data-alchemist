import { NextRequest } from "next/server";
import OpenAI from "openai";

export const runtime = "edge";

// Helper to clean code fences and markdown from LLM output
  function cleanFunctionBody(content: string) {
  let code = content
    .replace(/```[\s\S]*?```/g, "")
    .replace(/```(javascript)?/gi, "")
    .replace(/^export\s+default\s+/i, "")
    .trim();
  // Ensure the function returns a value
  if (!/^return\b/.test(code)) {
    code = "return " + code.replace(/^;/, "").trim().replace(/;$/, "") + ";";
  }
  return code;
}


export async function POST(req: NextRequest) {
  const { query, data, entityType } = await req.json();
  console.log('query:', query);
  console.log('entityType:', entityType);

  const apiKey = process.env.OPENROUTER_API_KEY || "";
  let functionBody: string | undefined;

  if (apiKey) {
    const openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey,
      defaultHeaders: {
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL,
        "X-Title": "Data Alchemist",
        "X-Description": "Natural language search for data entities",
      },
    });

    // Improved prompt: very explicit, no code fences, no markdown, only code
    const prompt = `Given entityType: "${entityType}" and query: "${query}", generate ONLY the JavaScript filter function body (no code fences, no comments, no function wrapper, no markdown, just the code). The function receives a variable 'item' representing a single entity.`;

    const completion = await openai.chat.completions.create({
      model: "meta-llama/llama-4-maverick:free",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });
    console.log("completion:", completion);

    if (!completion.choices || !completion.choices[0]?.message?.content) {
      return Response.json(
        { result: [], error: "OpenAI did not return a valid response." },
        { status: 500 }
      );
    }

    functionBody = cleanFunctionBody(completion.choices[0].message.content);
    console.log("FUNCTION BODY:", functionBody);
  } else {
    // Mock: Only supports a simple PriorityLevel 5 filter for demo
    if (entityType === "clients" && query.toLowerCase().includes("prioritylevel 5")) {
      functionBody = "return item.PriorityLevel == 5;";
    } else if (entityType === "tasks" && query.toLowerCase().includes("duration > 1")) {
      functionBody = "return item.Duration > 1;";
    } else {
      functionBody = "return true;";
    }
  }

  if (!functionBody) {
    return Response.json({ result: [], error: "No filter function generated." }, { status: 500 });
  }

  let filterFn: (item: any) => boolean;
  try {
    // eslint-disable-next-line no-new-func
    filterFn = new Function("item", functionBody) as (item: any) => boolean;
  } catch (e) {
    return Response.json({ result: [], error: "Failed to construct filter function: " + e }, { status: 500 });
  }

  let result: any[] = [];
  try {
    result = Array.isArray(data) ? data.filter(filterFn) : [];
  } catch (e) {
    return Response.json({ result: [], error: "Error running filter: " + e }, { status: 500 });
  }

  return Response.json({ result });
}